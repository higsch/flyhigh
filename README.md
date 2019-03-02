# flyhigh

... tracks flight prices from ARN to FRA. Experimental stage.

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
Check if your `chromedriver` is in your `PATH`. Otherwise download
an appropriate version from the [electron repo](https://github.com/electron/electron/releases).
