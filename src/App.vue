<template>
    <div class="container" :class="{ 'copy-mode': state.copied.length > 0 }">
        <div class="sidebar">
            <div class="settings">
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
                                'label--is-active': state.settings.mode.enter,
                            }"
                            >Entersplit</label
                        >
                    </div>
                    <div class="input-block__container">
                        <label
                            @click="state.settings.mode.enter = false"
                            :class="{
                                'label--is-active': !state.settings.mode.enter,
                            }"
                            >Autosplit</label
                        >
                    </div>
                </div>
            </div>
            <div class="saved">
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
            <div>
                <button class="button" @click="saveTweet">Save tweet</button>
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
    </div>
    <div class="update" v-if="state.hasUpdate">
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

export default defineComponent({
    setup() {
        // Saved Tweets

        const getSavedTweets = () => {
            const currentTweets = JSON.parse(
                localStorage.getItem('saved') || '[]'
            )
            return currentTweets
        }
        const state: any = reactive({
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
            hasUpdate: false,
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
            const savableState = {
                copied: state.copied,
                settings: state.settings,
                input: state.input,
            }
            return JSON.stringify(savableState || {})
        }

        const getLocalState = () =>
            JSON.parse(localStorage.getItem('state') || '')

        const recoverState = () => {
            Object.keys(getLocalState()).forEach(v => {
                console.log(v, getLocalState()[v])
                state[v] = getLocalState()[v]
            })
            state.hasUpdate = false
        }

        const saveCurrentState = () => {
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
                formatTweet(text, idx, state.tweets.total, state.settings),
                idx
            )
            state.copied.push(idx)
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
}

.saved {
    &__list {
        padding: 1em;
    }
    &__tweet {
        padding: 1em;
        border-radius: $rounded;
        @include shadow();
        & + & {
            margin-top: 1em;
        }
    }
}
.update {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1em;
    background-color: $primary-color;
    color: white;
    @include shadow('large');
    border-radius: $rounded;
}

.settings {
    padding: 1em;
    border-bottom: 1px solid $primary-color;
    background-color: white;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-start;

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
    padding: 1em;
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
        padding: 1em;
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
    .button {
        position: absolute;
        left: 50%;
        bottom: 2em;
        transform: translateX(-50%);
    }
    .copy-mode & {
        opacity: 0.5;
    }
}

.tweets {
    &__tweet {
        padding: 1em;
        border-radius: $rounded;
        @include shadow();
        & + & {
            margin-top: 1em;
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
