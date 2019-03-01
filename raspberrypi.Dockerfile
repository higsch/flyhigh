FROM ubuntu:bionic

LABEL authors="Matthias Stahl <matthias.stahl@ki.se>"
LABEL description="Docker image containing flyhigh."

RUN \
  apt-get update && \
  apt-get install -y python3.7 python3-pip chromium-browser && \
  rm -rf /var/lib/apt/lists/*

RUN \
  pip3 install selenium bs4

COPY chromedriver_raspberrypi /usr/bin/chromedriver

COPY flyhigh.py /app/

RUN mkdir db

CMD ["python3", "/app/flyhigh.py"]
