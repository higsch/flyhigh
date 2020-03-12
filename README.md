# flyhigh

>... tracks flight prices from ARN to FRA. Experimental stage.


## Visualise flight prices


### Get it running
```
git clone https://github.com/higsch/flyhigh.git
cd visualisation/app/
npm run dev
```

### This is how it looks like
![Screenshot_00](/visualisation/app/screenshot_00.png)


![Screenshot_01](/visualisation/app/screenshot_01.png)


## Collect flight prices
Get the docker image here.
```
docker pull matthiasstahl/flyhigh

#or: if you are on a raspberry pi system
docker pull matthiasstahl/flyhigh:pi
```

Then, let's roll!
```
# assumes a db folder in the current directory
docker run -it -v "$(pwd)"/db:/db matthiasstahl/flyhigh
```

And of course, if you want to have it run on your system directly.
```
pip3 install selenium bs4
python3 flyhigh.py
```
Check if the `chromedriver` is in your `PATH`. Otherwise download
an appropriate version from the [electron repo](https://github.com/electron/electron/releases).
The driver you need for a raspberrypi system is `chromedriver-*-linux-armv7l.zip`.
