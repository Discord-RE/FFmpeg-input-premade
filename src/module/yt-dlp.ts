import { $ } from "execa";
import { NewApi } from "@dank074/discord-video-stream";

export interface YtdlpFormat {
    format_id: string,
    ext: string,
    resolution: string | null,
    fps?: number | null
}

export async function getFormats(link: string)
{
    const result = (await $`yt-dlp --print "%(formats)+j" ${link}`).stdout;
    // Thank you execa for adding quotes to the output
    return JSON.parse(result.slice(1, result.length - 1)) as YtdlpFormat[];
}

export function ytdlp(
    link: string,
    format?: string,
    encoderOptions?: Partial<NewApi.EncoderOptions>,
    cancelSignal?: AbortSignal,
) {
    const args = [
        "--format",
        format ?? "bv*+ba/b",
        "-o",
        "-",
        "-R",
        "infinite",
        link,
    ];
    const ytdlpProcess = $({
        cancelSignal,
        killSignal: "SIGINT",
        buffer: { stdout: false },
    })("yt-dlp", args);
    ytdlpProcess.catch(() => {});
    /**
     * Dummy reader, if both yt-dlp and ffmpeg ends at the same time, yt-dlp
     * can't end properly because stdout isn't drained
     */
    ytdlpProcess.stdout.on("data", () => {});
    const { command, output, promise } = NewApi.prepareStream(
        ytdlpProcess.stdout,
        encoderOptions,
        cancelSignal,
    );
    return {
        output,
        command: {
            ytdlp: ytdlpProcess,
            ffmpeg: command,
        },
        promise: {
            ytdlp: ytdlpProcess,
            ffmpeg: promise,
        },
    };
}
