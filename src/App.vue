<template>
  <div class="container" :class="{ 'copy-mode': state.copied.length > 0 }">
    <div class="settings">
      <div>
        <label>Total chars<input type="text" v-model="state.chars"/></label>
      </div>
      <div>
        <label
          >Add number<input type="checkbox" v-model="state.number.active"
        /></label>
        <label v-if="state.number.active"
          >Start with number<input
            type="checkbox"
            v-model="state.number.position"
        /></label>
      </div>
    </div>
    <div class="input">
      <textarea v-model="state.input" @input="autoResize" />
    </div>
    <div class="output">
      <ul class="tweets">
        <li
          class="tweets__tweet"
          v-for="(tweet, idx) in state.tweets"
          :key="idx"
          @click="copy(formatTweet(tweet, idx, state.tweets.length))"
          :class="{ 'tweets__tweet--copied': state.copied.includes(idx) }"
        >
          <p class="tweets__content">
            {{ formatTweet(tweet, idx, state.tweets.length) }}
          </p>
          <small class="tweets__chars">{{ tweet.length }}</small>
          <small class="tweets__count" v-if="!state.number.active"
            >{{ idx + 1 }}/{{ state.tweets.length }}</small
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, computed, defineComponent, watch } from "vue";
export default defineComponent({
  setup() {
    const splitIntoTweets = (
      input: string,
      chars: number,
      numbering: boolean
    ): string[] => {
      const words = input.split(" ");
      const tweets: string[] = [];
      const allowedLength =
        chars - (numbering ? (input.length > chars * 8 ? 7 : 5) : 0);

      let tweet = "";

      for (let i = 0; i < words.length; i++) {
        const newTweet = tweet + " " + words[i];

        if (newTweet.length > allowedLength) {
          tweets.push(tweet);
          tweet = words[i];
        } else {
          tweet = newTweet;
        }
        if (i + 1 === words.length) tweets.push(tweet);
      }
      return tweets;
    };

    const state: any = reactive({
      input: "one two three",
      tweets: computed(() =>
        splitIntoTweets(state.input, state.chars, state.number.active)
      ),
      chars: 144,
      copied: [],
      number: { active: false, position: false },
    });

    watch(
      () => state.input,
      () => {
        if (state.copied.length > 0) state.copied.length = 0;
      }
    );

    const autoResize = (event: any) => {
      event.target.style.height = "auto";
      event.target.style.height = `${event.target.scrollHeight}px`;
    };
    const copy = (text: string, idx: number) => {
      const copyElement = document.createElement("input");
      copyElement.value = text.trim();
      document.body.appendChild(copyElement);

      copyElement.select();
      copyElement.setSelectionRange(0, 9999);
      document.execCommand("copy");
      document.body.removeChild(copyElement);

      state.copied.push(idx);
    };

    const formatTweet = (tweet: string, idx: number, total: number) => {
      if (!state.number.active) return tweet;
      else {
        if (state.number.position) {
          return `${idx}/${total} ${tweet}`;
        } else {
          return `${tweet} ${idx}/${total}`;
        }
      }
    };

    return {
      state,
      copy,
      autoResize,
      formatTweet,
    };
  },
});
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
body,
html {
  padding: 0;
  margin: 0;
}
* {
  box-sizing: border-box;
}
$blue: #00acee;
$small: "screen and (max-width: 960px)";
$large: "screen and (min-width: 961px)";
li,
ul {
  margin: 0;
  list-style-type: none;
  padding: 0;
}
.container {
  display: flex;
  @media #{$small} {
    flex-direction: column;
  }
}

.settings {
  padding: 1em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  background-color: white;
  display: flex;
  justify-content: space-between;
  .copy-mode & {
    opacity: 0.5;
  }
}
.input,
.output {
  padding: 1em;
  @media #{$large} {
    width: 50%;
  }
}

.input {
  textarea {
    width: 100%;
    resize: auto;
    padding: 1em;
    border-radius: 0.5em;
    box-shadow: 0 0 1em 0 rgba(0, 0, 0, 0.25);
    border: 0px;
    line-height: 1.5;
    background-color: #333333;
    color: white;
    font-family: inherit;
    font-size: 1em;
    &:focus {
      outline: none;
      background-color: $blue;
    }
  }
  .copy-mode & {
    opacity: 0.5;
  }
}

.tweets {
  &__tweet {
    padding: 1em;
    border-radius: 0.5em;
    box-shadow: 0 0 1em 0 rgba(0, 0, 0, 0.25);
    & + & {
      margin-top: 1em;
    }
    position: relative;
    &--copied {
      opacity: 0.5;
      border: 1px solid $blue;
    }
  }
  &__chars,
  &__count {
    position: absolute;
    top: 0;
    padding: 0.5em;
    opacity: 0.5;
  }
  &__chars {
    right: 0;
  }
  &__count {
    left: 0;
  }
}
</style>
