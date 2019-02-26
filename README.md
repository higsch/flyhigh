# flyhigh

... tracks flight prices from ARN to FRA. Experimental stage.

Get the docker image here.
```
docker pull matthiasstahl/flyhigh
```

Run command.
```
# assumes a db folder in the current directory
docker run -it -v "$(pwd)"/db:/db matthiasstahl/flyhigh
```
