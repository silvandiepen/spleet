<template>
    <div class="container" :class="{ 'copy-mode': state.copied.length > 0 }">
        <div class="sidebar">
            <div
                class="settings"
                :class="[
                    state.showSettings
                        ? 'settings--visible'
                        : 'settings--invisible',
                ]"
            >
                <button
                    class="settings__toggle"
                    @click="state.showSettings = !state.showSettings"
                ></button>
                <div class="settings__container">
                    <div class="input-block">
                        <select id="input-chars" v-model="state.settings.chars">
                            <option value="140">Short tweets</option>
                            <option value="280">Long tweets</option></select
                        >
                    </div>
                    <div class="input-block">
                        <div class="input-block__container">
                            <input
                                type="checkbox"
                                id="input-numbering"
                                v-model="state.settings.number.active"
                            />
                            <label for="input-numbering">Add numbering</label>
                        </div>
                    </div>
                    <div
                        v-if="state.settings.number.active"
                        class="input-block input-block--switcher"
                    >
                        <div class="input-block__container">
                            <label
                                for="input-start-number"
                                @click="state.settings.number.position = true"
                                :class="{
                                    'label--is-active':
                                        state.settings.number.position,
                                }"
                                >Start</label
                            >
                        </div>
                        <div class="input-block__container">
                            <label
                                for="input-start-number"
                                @click="state.settings.number.position = false"
                                :class="{
                                    'label--is-active': !state.settings.number
                                        .position,
                                }"
                                >End</label
                            >
                        </div>
                    </div>
                    <div class="input-block input-block--switcher">
                        <div class="input-block__container">
                            <label
                                @click="state.settings.mode.enter = true"
                                :class="{
                                    'label--is-active':
                                        state.settings.mode.enter,
                                }"
                                >Entersplit</label
                            >
                        </div>
                        <div class="input-block__container">
                            <label
                                @click="state.settings.mode.enter = false"
                                :class="{
                                    'label--is-active': !state.settings.mode
                                        .enter,
                                }"
                                >Autosplit</label
                            >
                        </div>
                    </div>
                </div>
            </div>
            <div class="saved saved--desktop">
                <ul class="saved__list">
                    <li
                        class="saved__tweet"
                        v-for="tweet in state.savedTweets"
                        :key="tweet.id"
                        @click="loadTweet(tweet.id)"
                    >
                        {{ capTweet(tweet.input, 100) }}
                    </li>
                </ul>
            </div>
        </div>

        <div class="input-column">
            <textarea v-model="state.input" @input="autoResize" />
            <div class="button-group">
                <button class="button" v-if="state.id > 0" @click="newTweet">
                    New
                </button>
                <button class="button" @click="saveTweet">Save</button>
            </div>
        </div>

        <div class="output-column">
            <ul class="tweets">
                <li
                    class="tweets__tweet"
                    v-for="(tweet, idx) in state.tweets"
                    :key="idx"
                    @click="copyTweet(tweet, idx)"
                    :class="[
                        state.copied.includes(idx)
                            ? 'tweets__tweet--copied'
                            : '',
                        tweet.length > state.settings.chars
                            ? 'tweets__tweet--invalid'
                            : 'tweets__tweet--valid',
                    ]"
                >
                    <p class="tweets__content">
                        {{
                            formatTweet(
                                tweet,
                                idx,
                                state.tweets.length,
                                state.settings
                            )
                        }}
                    </p>
                    <small class="tweets__chars">{{ tweet.length }}</small>
                    <small
                        class="tweets__count"
                        v-if="!state.settings.number.active"
                        >{{ idx + 1 }}/{{ state.tweets.length }}</small
                    >
                </li>
            </ul>
        </div>
        <div class="saved saved--mobile">
            <ul class="saved__list">
                <li
                    class="saved__tweet"
                    v-for="tweet in state.savedTweets"
                    :key="tweet.id"
                    @click="loadTweet(tweet.id)"
                >
                    {{ capTweet(tweet.input, 100) }}
                </li>
            </ul>
        </div>
    </div>
    <div class="message message--copy message--bottom" v-if="state.lastCopy">
        <strong>copied:</strong> {{ state.lastCopy }}
    </div>
    <div class="message message--update message--center" v-if="state.hasUpdate">
        <h3>We have an update for ya!</h3>
        <p>Do you want to keep this information, or the updated one?</p>
        <button @click="updateState">The updated one</button>
        <button @click="keepState">No, this is the last</button>
    </div>
</template>

<script lang="ts">
import { reactive, computed, defineComponent, watch, onMounted } from 'vue'
import {
    splitEnterMode,
    splitIntoTweets,
    autoResize,
    formatTweet,
    copy,
    capTweet,
} from './services'

interface Settings {
    mode: {
        enter: boolean
    }
    number: {
        active: boolean
        position: boolean
    }
    chars: number
}

interface SavedTweet {
    input: string
    settings: Settings
    id: number
}
type Tweets = string[]

interface SavedState {
    copied: number[]
    settings: Settings
    input: string
}

interface State {
    input: string
    id: number
    tweets: Tweets
    settings: Settings
    copied: number[]
    lastCopy: string
    hasUpdate: boolean
    showSettings: boolean
    savedTweets: SavedTweet[]
}

export default defineComponent({
    setup() {
        // Saved Tweets

        const getSavedTweets = () => {
            const currentTweets = JSON.parse(
                localStorage.getItem('saved') || '[]'
            )
            return currentTweets
        }
        const state: State = reactive({
            input: 'one two three',
            id: 0,
            tweets: computed(() => {
                if (state.settings.mode.enter)
                    return splitEnterMode(
                        state.input,
                        state.settings.chars,
                        state.settings.number.active
                    )
                else
                    return splitIntoTweets(
                        state.input,
                        state.settings.chars,
                        state.settings.number.active
                    )
            }),
            settings: {
                mode: { enter: false },
                number: { active: false, position: false },
                chars: 140,
            },
            copied: [],
            lastCopy: '',
            hasUpdate: false,
            showSettings: false,
            savedTweets: getSavedTweets(),
        })

        watch(
            () => state.input,
            () => {
                if (state.copied.length > 0) state.copied.length = 0
            }
        )
        const hashCode = (s: string): number =>
            Math.abs(
                s.split('').reduce((a, b) => {
                    a = (a << 5) - a + b.charCodeAt(0)
                    return a & a
                }, 0)
            )

        const removeSavedTweet = (id: number): void => {
            const currentTweets = JSON.parse(
                localStorage.getItem('saved') || '[]'
            ).filter((t: SavedTweet) => t.id !== id)
            localStorage.setItem('saved', JSON.stringify(currentTweets))
        }

        const newTweet = (): void => {
            state.input = ''
            state.id = 0
        }
        const saveTweet = (): void => {
            const savingTweet = {
                input: state.input,
                settings: state.settings,
                id: hashCode(state.input),
            }
            const currentTweets = JSON.parse(
                localStorage.getItem('saved') || '[]'
            )

            console.log(state.id)

            if (state.id < 1) {
                currentTweets.push(savingTweet)
            } else {
                if (
                    currentTweets.findIndex(
                        (t: SavedTweet) => t.id == state.id
                    ) > 0
                ) {
                    const currentIndex = currentTweets.findIndex(
                        (t: SavedTweet) => t.id == state.id
                    )
                    currentTweets[currentIndex] = savingTweet
                } else {
                    currentTweets.push(savingTweet)
                }
            }
            localStorage.setItem('saved', JSON.stringify(currentTweets))

            state.savedTweets = getSavedTweets()
        }

        const loadTweet = (id: number): void => {
            const newTweet = JSON.parse(
                localStorage.getItem('saved') || '[]'
            ).find((t: SavedTweet) => t.id == id)
            // console.log(newTweet)
            if (newTweet) {
                state.input = newTweet.input
                state.settings = newTweet.settings
                state.id = newTweet.id
            }
        }

        // LocalState
        const createLocalState = (): string => {
            const savableState: SavedState = {
                copied: state.copied,
                settings: state.settings,
                input: state.input,
            }
            return JSON.stringify(savableState || {})
        }

        const getLocalState = (): SavedState =>
            JSON.parse(localStorage.getItem('state') || '')

        const recoverState = (): void => {
            const localState = getLocalState()
            state.copied = localState.copied
            state.settings = localState.settings
            state.input = localState.input

            state.hasUpdate = false
        }

        const saveCurrentState = (): void => {
            localStorage.setItem('state', createLocalState())
        }

        setInterval(() => {
            if (JSON.stringify(getLocalState()) !== createLocalState()) {
                state.hasUpdate = true
            }
        }, 10000)

        onMounted(() => {
            recoverState()
        })

        watch(
            () => state,
            () => saveCurrentState(),
            { deep: true }
        )

        const updateState = () => {
            recoverState()
            state.hasUpdate = false
            console.log('yes, we updated your state')
        }
        const keepState = () => {
            saveCurrentState()
            state.hasUpdate = false
            console.log('We kept it')
        }

        // Copy a Tweet

        const copyTweet = (text: string, idx: number) => {
            copy(
                formatTweet(text, idx, state.tweets.length, state.settings),
                idx
            )
            state.copied.push(idx)
            state.lastCopy = text
            setTimeout(() => (state.lastCopy = ''), 2000)
        }

        // Return values

        return {
            state,
            copyTweet,
            autoResize,
            formatTweet,
            updateState,
            keepState,
            saveTweet,
            newTweet,
            loadTweet,
            removeSavedTweet,
            capTweet,
        }
    },
})
</script>

<style lang="scss">
@import './assets/scss/index.scss';

#app {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
body,
html {
    padding: 0;
    margin: 0;
}
* {
    box-sizing: border-box;
}
li,
ul {
    margin: 0;
    list-style-type: none;
    padding: 0;
}
.container {
    display: flex;
    height: 100vh;
    @media #{$small} {
        flex-direction: column;
    }
}

.sidebar {
    width: 25%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    @media #{$small} {
        width: 100%;
    }
}

.saved {
    &--mobile {
        background-color: $primary-color;
        @media #{$large} {
            display: none;
        }
    }
    &--desktop {
        @media #{$small} {
            display: none;
        }
    }
    &__list {
        padding: $space;
    }
    &__tweet {
        padding: $space;
        border-radius: $rounded;
        @media #{$small} {
            background-color: rgba(white, 0.5);
        }
        @include shadow();
        & + & {
            margin-top: $space;
        }
    }
}
.message {
    position: fixed;
    padding: 1em;
    background-color: $primary-color;
    color: white;
    @include shadow('large');
    border-radius: $rounded;
    &--center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    &--bottom {
        bottom: $space;
        left: 50%;
        transform: translateX(-50%);
    }
}

@function repeat-radial-gradient($times, $gradient...) {
    $gradients: '';
    @for $i from 1 through $times {
        $comma: ',';
        @if $i == $times {
            $comma: '';
        }
        $gradients: $gradients + 'radial-gradient(#{$gradient})#{$comma}';
    }
    @return unquote($gradients);
}

.settings {
    @media #{$large} {
        padding: $space;
    }
    &__toggle {
        width: 3em;
        height: 3em;
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(-50%, 50%) scale(1);
        background-color: $primary-color;
        background-image: repeat-radial-gradient(
            9,
            closest-side,
            $white 100%,
            transparent
        );
        background-size: 0.25em 0.25em;
        background-repeat: no-repeat;
        background-position: 33% 33%, 33% 50%, 33% 66%, 50% 66%, 50% 50%,
            50% 66%, 66% 33%, 66% 50%, 66% 66%;
        border-radius: 50%;
        display: block;
        z-index: 10;
        border: none;
        transition: transform 0.3s;
        @media #{$large} {
            transform: translate(-50%, 50%) scale(0);
        }
        @include shadow();
    }
    &__container {
        background-color: white;
        display: flex;
        justify-content: flex-start;
        flex-direction: column;
        align-items: flex-start;

        @media #{$small} {
            position: fixed;
            top: $space;
            left: 50%;
            width: calc(100% - (#{$space} * 2));
            z-index: 1;
            transform: translateX(-50%) scale(0);
            // transform-origin: 100% 0;
            padding: $space;
            border-radius: $rounded;
            background-color: $black;
            transition: transform 0.3s;
            .settings--visible & {
                transform: translateX(-50%) scale(1);
            }
        }
    }

    .copy-mode & {
        opacity: 0.5;
    }
    .input-block {
        border-radius: 0.5em;
        width: 100%;

        input,
        select {
            font-size: 1em;
        }

        &__container {
            border-radius: 0.5em;
            width: 100%;

            @include shadow();
        }
        &--switcher {
            display: flex;
            .input-block__container {
                label {
                    border-radius: 0;
                }
                &:first-child label {
                    border-radius: $rounded 0 0 $rounded;
                }
                &:last-child label {
                    border-radius: 0 $rounded $rounded 0;
                }
            }
        }

        + .input-block {
            margin-top: 1em;
        }

        input[type='checkbox'] {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        label {
            position: relative;
            display: block;
            padding: 1em;
            border-radius: inherit;
            background-color: lighten($inactive-color, 20%);
            color: darken($inactive-color, 20%);

            &.label {
                &--is-active {
                    z-index: 2;
                    animation: popIn 0.3s;

                    background-color: white;
                    color: black;
                }
            }
        }

        input[type='checkbox'] + label {
            animation: popOut 0.3s;
            background-color: lighten($inactive-color, 20%);
            color: darken($inactive-color, 20%);
        }

        input[type='checkbox']:checked + label {
            animation: popIn 0.3s;
            z-index: 2;
            background-color: white;
            color: black;
        }
        select {
            padding: 1em;
            width: 100%;
            border-radius: inherit;
            @include shadow();
            border: none;
        }
    }
}
.input-column,
.output-column {
    padding: $space;
    min-height: 50vh;
    overflow: scroll;
    @media #{$large} {
        width: 50%;
    }
}

.input-column {
    position: relative;
    background-color: $black;
    textarea {
        width: 100%;
        resize: auto;
        height: 100%;
        padding: $space;
        border-radius: $rounded;
        transition: height 0.3s ease-in-out;
        // @include shadow();
        border: 0px;
        line-height: 1.5;
        background-color: #333333;
        color: white;
        font-family: inherit;
        font-size: 1em;
        &:focus {
            outline: none;
            background-color: $primary-color;
        }
    }
    .button-group {
        position: absolute;
        left: 50%;
        bottom: 2em;
        transform: translateX(-50%);
        @media #{$small} {
            //     right: 0;
            //     left: auto;
            //     transform: none;

            transform: translate(-50%, 50%);
        }
    }
    .copy-mode & {
        opacity: 0.5;
    }
}

.tweets {
    &__tweet {
        padding: $space;
        border-radius: $rounded;
        @include shadow();
        & + & {
            margin-top: calc(#{$space}/ 2);
        }
        position: relative;
        &--copied {
            opacity: 0.5;
            @include shadow('active');
        }
        &--invalid {
            @include shadow('error');
        }
    }
    &__chars,
    &__count {
        position: absolute;
        top: 0;
        padding: 0.5em;
        font-size: 0.75em;
        color: white;
        background-color: $primary-color;
        border-radius: 0 $rounded 0 $rounded;
    }

    &__chars {
        right: 0;
        .tweets__tweet--invalid & {
            background-color: $red;
        }
    }
    &__count {
        left: 0;
        border-radius: $rounded 0 $rounded 0;
    }
}
</style>
