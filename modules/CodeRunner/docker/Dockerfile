FROM ubuntu:20.04

LABEL maintainer="antares.oier@gmail.com"

ARG arch=amd
COPY sources-${arch}.list /etc/apt/sources.list

RUN apt update && apt install -y curl gcc g++ python3 software-properties-common

RUN add-apt-repository -y ppa:linuxuprising/java
RUN apt update && echo yes | apt install -y oracle-java14-installer oracle-java14-set-default

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y nodejs
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update && apt install -y yarn
RUN yarn config set registry https://registry.npm.taobao.org/
RUN yarn global add typescript ts-node