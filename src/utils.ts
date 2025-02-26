import type Ffmpeg from "fluent-ffmpeg";

export function randomInclusive(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

export function ffmpegPromise(
    command: Ffmpeg.FfmpegCommand,
    cancelSignal?: AbortSignal,
) {
    const promise = new Promise<void>((resolve, reject) => {
        command.on("error", (err) => {
            if (cancelSignal?.aborted) reject(cancelSignal.reason);
            else reject(err);
        });
        command.on("end", () => resolve());
    });
    return promise;
}
