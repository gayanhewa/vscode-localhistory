[![](https://vsmarketplacebadge.apphb.com/version/gayanhewa.local-history.svg)](https://marketplace.visualstudio.com/items?itemName=gayanhewa.local-history) [![](https://vsmarketplacebadge.apphb.com/installs/gayanhewa.local-history.svg)](https://marketplace.visualstudio.com/items?itemName=gayanhewa.local-history) [![](https://vsmarketplacebadge.apphb.com/rating/gayanhewa.local-history.svg)](https://marketplace.visualstudio.com/items?itemName=gayanhewa.local-history)

# Local History for VSCode files

Provide Local History for your workspace files.

## Features

Persistant in-memory workspace local history for files. Files backed up every 10 mins by default. Built in diff integration to diff against local history.

![Alt text](/assets/localhistory.gif?raw=true "Local History Demo")
![Alt text](/assets/localhistory-config.gif?raw=true "Local History Demo")

## Extension Settings

With version `v0.0.3` we are introducing the ability to configure the back up interval and how many items thats kept in memory. We would ideally recommend to eep the `numberOfLocalHistoryItems` to something between 5-10 and the `backupInterval` to something around 600-900 seconds.

```
    "localhistory.backupInterval": {
        "default": "600"
    },
    "localhistory.numberOfLocalHistoryItems": {
        "default": "5"
    }
```

![Alt text](/assets/localhistory-config.gif?raw=true "Local History Demo")

## Known Issues

Please report if anything found.

**Enjoy!**
