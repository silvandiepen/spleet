export const splitIntoTweets = (
    input: string,
    chars: number,
    numbering: boolean
): string[] => {
    const words = input.split(' ')
    const tweets: string[] = []
    const allowedLength =
        chars - (numbering ? (input.length > chars * 8 ? 7 : 5) : 0)

    let tweet = ''

    for (let i = 0; i < words.length; i++) {
        const newTweet = tweet + ' ' + words[i]

        if (newTweet.length > allowedLength) {
            tweets.push(tweet)
            tweet = words[i]
        } else {
            tweet = newTweet
        }
        if (i + 1 === words.length) tweets.push(tweet)
    }
    return tweets
}

export const splitEnterMode = (
    input: string,
    chars: number,
    numbering: boolean
): string[] => {
    return input.split(/\r?\n\n/).filter(tweet => tweet !== '')
}

export const formatTweet = (
    tweet: string,
    idx: number,
    total: number,
    settings: any
) => {
    if (!settings.number.active) return tweet
    else {
        if (settings.number.position) {
            return `${idx + 1}/${total} ${tweet}`
        } else {
            return `${tweet} ${idx + 1}/${total}`
        }
    }
}
