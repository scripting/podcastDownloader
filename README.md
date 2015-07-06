# podcastDownloader

JavaScript app to download all the enclosures in a <a href="https://github.com/scripting/river4">River4</a> river.

### How to

Edit config.json to point to the river file you want to download podasts from. By default it's set up to read podcasts from podcatch.com. 

You can also specify the location of the folder to download the MP3 files to.

When you're ready, run the app:

node downloader.js

#### How it works

Every minute it reads the river and checks to see if there are any new podcasts, if so, it downloads one, and waits until the top of the next minute when it does it again.

It's pretty simple. ;-)

#### Questions?

Please post questions and comments on the <a href="https://groups.google.com/forum/?fromgroups#!forum/river4">River4 mail list</a>. 

