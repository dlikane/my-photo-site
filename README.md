# My photo site


## Notes

Connecting to dropbox:
https://www.dropbox.com/developers/apps
app name: dlikane.my-photo-site
the folder is Apps/my-photo-site (!)

pnpm add -g vercel
vercel login

vercel env add DROPBOX_APP_KEY your_app_key
vercel env add DROPBOX_APP_SECRET your_app_secret
vercel env add DROPBOX_REFRESH_TOKEN your_refresh_token

Copy .env across :)

Dropbox
https://www.dropbox.com/developers/apps/info/knp5qbzp4zyo0z9
Vercel
https://vercel.com/dlikanes-projects/my-photo-site
Git
https://github.com/dlikane/my-photo-site

YouTube:
https://console.cloud.google.com/

vercel env add YOUTUBE_API_KEY 
vercel env add YOUTUBE_PLAYLIST_ID


## dev

Running locally:
```
pnpm vercer-dev
```

NOTE:
    there is call back list for AOuth2 in dropbox, need to add proper URL once configured
    Maybe need to regenerate refresh token

## refresh token
look at scripts:
getRefreshToken.ps
refreshAccessToken.ps