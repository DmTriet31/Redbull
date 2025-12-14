lavalink:
    plugins:
        - dependency: "dev.lavalink.youtube:youtube-plugin:1.16.0"
          repository: "https://maven.lavalink.dev/releases"
        - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.1"
          repository: "https://maven.lavalink.dev/releases"
        - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
          repository: "https://maven.lavalink.dev/releases"
    server:
        bufferDurationMs: 400
        readTimeout: 60000           # Read timeout in milliseconds (60 seconds)
        requestTimeout: 60000 
        filters:
            channelMix: true
            distortion: true
            equalizer: true
            karaoke: true
            lowPass: true
            rotation: true
            timescale: true
            tremolo: true
            vibrato: true
            volume: true
        frameBufferDurationMs: 5000
        gcWarnings: true
        opusEncodingQuality: 5
        password: glace
        playerUpdateInterval: 5
        resamplingQuality: HIGH
        soundcloudSearchEnabled: true
        sources:
            bandcamp: true
            http: true
            local: false
            nico: true
            soundcloud: true
            twitch: true
            vimeo: true
            youtube: false
        trackStuckThresholdMs: 10000
        useSeekGhosting: true
        youtubePlaylistLoadLimit: 6
        youtubeSearchEnabled: true
plugins:
    youtube:
        enabled: true
        allowSearch: true
        allowDirectVideoIds: true
        allowDirectPlaylistIds: true
        clients:
            - MUSIC
            - WEB
            - TV
            - TVHTML5EMBEDDED
            - ANDROID_VR
        remoteCipher:
            url: "https://cipher.kikkia.dev/"
            userAgent: "lavalink-server"
        oauth:
            enabled: true
            skipInitialization: true
            refreshToken: "1//05eVJMrhyUcq2CgYIARAAGAUSNwF-L9Ir3gEa6DSFX0YleFRB0OjyNolItThNkeWsBx6MN0D0_Pws4kacKMQsxTSHZZatAeaxx5k"
    lavasrc:
        providers:
            - "ytsearch:\"%ISRC%\""
            - "ytsearch:%QUERY%"
        sources:
            spotify: true
            applemusic: false
            deezer: false
            yandexmusic: false
            flowerytts: false
            youtube: true
        spotify:
            clientId: "b9a4b5775f1847a2b072573589b530f7"
            clientSecret: "682ef411fa5942d28bfe6c409e90f202"
            countryCode: "US"
            playlistLoadLimit: 10
            albumLoadLimit: 10
            resolveArtistsInSearch: true
            localFiles: false
    lavasearch:
        sources:
            - spotify
            - youtube
logging:
    file:
        path: ./logs/
    level:
        lavalink: INFO
        root: INFO
        dev.lavalink.youtube.http.YoutubeOauth2Handler: INFO
    logback:
        rollingPolicy:
            maxFileSize: 1GB
            maxHistory: 30
    request:
        enabled: true
        includeClientInfo: true
        includeHeaders: false
        includePayload: true
        includeQueryString: true
        maxPayloadLength: 10000
metrics:
    prometheus:
        enabled: false
        endpoint: /metrics
sentry:
    dsn: ""
    environment: ""
server:
    address: 0.0.0.0
    http2:
        enabled: false
    port: 8003
