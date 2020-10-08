export const autoResize = (event: any) => {
    event.target.style.height = 'auto'
    event.target.style.height = `${event.target.scrollHeight}px`
}

export const copy = (text: string, idx: number) => {
    const copyElement = document.createElement('input')
    copyElement.value = text.trim()
    document.body.appendChild(copyElement)

    copyElement.select()
    copyElement.setSelectionRange(0, 9999)
    document.execCommand('copy')
    document.body.removeChild(copyElement)
}

export const capTweet = (text: string, max = 100) => {
    return text.substring(0, max) + (text.length > max ? '...' : '')
}
