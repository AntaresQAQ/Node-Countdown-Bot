FROM ubuntu:20.04

LABEL maintainer="antares.oier@gmail.com"

ARG arch=amd
COPY sources-${arch}.list /etc/apt/sources.list

RUN apt update && apt install -y --fix-missing curl gnupg gcc g++ python3 openjdk-14-jdk

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y --fix-missing nodejs
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update && apt install -y --fix-missing yarn
RUN yarn config set registry https://registry.npm.taobao.org/
RUN yarn global add typescript ts-node