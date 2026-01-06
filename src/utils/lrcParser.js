/**
 * Parses an LRC string into an array of lyric objects.
 * Format: [{ time: number, text: string }]
 * Time is in seconds.
 * 
 * @param {string} lrcString - The raw LRC content
 * @returns {Array<{time: number, text: string}>} sorted array of lyric objects
 */
export const parseLRC = (lrcString) => {
    if (!lrcString) return [];

    const lines = lrcString.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    lines.forEach(line => {
        // Find all timestamps in the line (some lines might have multiple like [00:01.00][00:05.00]Text)
        const matches = [...line.matchAll(timeRegex)];
        if (matches.length > 0) {
            // Extract the text part (everything after the last bracket)
            const text = line.replace(timeRegex, '').trim();

            matches.forEach(match => {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const milliseconds = parseInt(match[3], 10);

                // Convert to total seconds
                // ms in LRC is usually centiseconds (2 digits) or milliseconds (3 digits)
                // If 2 digits, it's 10ms resolution. If 3, it's 1ms.
                const msInSeconds = milliseconds * (match[3].length === 2 ? 0.01 : 0.001);
                const totalSeconds = minutes * 60 + seconds + msInSeconds;

                lyrics.push({
                    time: totalSeconds,
                    text: text
                });
            });
        }
    });

    // Sort by time
    lyrics.sort((a, b) => a.time - b.time);

    return lyrics;
};

/**
 * Get the current lyric based on time.
 * @param {Array} lyrics - Parsed lyrics array
 * @param {number} currentTime - Current time in seconds
 * @returns {Object|null} - The current lyric object or null
 */
export const getCurrentLyric = (lyrics, currentTime) => {
    if (!lyrics || lyrics.length === 0) return null;

    // Find the last lyric that has started
    let current = null;
    for (let i = 0; i < lyrics.length; i++) {
        if (currentTime >= lyrics[i].time) {
            current = lyrics[i];
        } else {
            break;
        }
    }

    return current;
};
