lavalink:
    server:
        bufferDurationMs: 400        
        frameBufferDurationMs: 1000  
        gcWarnings: true
        opusEncodingQuality: 5       
        password: glace
        playerUpdateInterval: 5
        resamplingQuality: MEDIUM    
        soundcloudSearchEnabled: true
        
        # Only enable filters you actually USE
        filters:
            equalizer: true        
            volume: true             
            timescale: true     
            channelMix: true       
            distortion: true        
            karaoke: true           
            lowPass: true        
            rotation: true       
            tremolo: true       
            vibrato: true          
        
        sources:
            bandcamp: true
            http: true
            local: false
            nico: false              
            soundcloud: true
            twitch: false           
            vimeo: false           
            youtube: false       
        
        trackStuckThresholdMs: 10000
        useSeekGhosting: true
        youtubePlaylistLoadLimit: 6
        youtubeSearchEnabled: true

lavasrc:
    providers:
        - spsearch:%QUERY%
        - ytmsearch:"%ISRC%"
        - ytmsearch:%QUERY%
    
    sources:
        spotify: true
        applemusic: false
        deezer: false
        flowerytts: false
        yandexmusic: false
    
    spotify:
        clientId: f71a3da30e254962965ca2a89d6f74b9
        clientSecret: 199a619d22dd4e55a4a2c1a7a3d70e63
        countryCode: US
        playlistLoadLimit: 6
        albumLoadLimit: 6


logging:
    level:
        root: INFO
        lavalink: INFO
    
    file:
        path: ./logs/
    
    logback:
        rollingPolicy:
            maxFileSize: 100MB      
            maxHistory: 7         
    
    request:
        enabled: false               
        includeClientInfo: false
        includeHeaders: false
        includePayload: false
        includeQueryString: false

metrics:
    prometheus:
        enabled: false

plugins:
    youtube:
        enabled: true
        pot:
            token: MnhT2vfKOIPrGlPmfGCghVao7Op9y51JxlDz5GbOOSKgXodzmFYTQ_Lg-lyGH552S5ymgQPlMQsX2g9NFyGq32sQ9PA6DLqLkcU5gSWNpdFNkxLUnYmeAzQqBYiYJ8asxVcn98xzcx3QEByRU225fAlDyyky7WKwUOU=
            visitorData: CgtWSG51Z0ViNkNjbyiRtY3HBjIKCgJJThIEGgAgag==

sentry:
    dsn: ""
    environment: ""

server:
    address: 0.0.0.0
    port: 8003
    http2:
        enabled: false
