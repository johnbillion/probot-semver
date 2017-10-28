# Probot semver

> A GitHub app built with [Probot](https://github.com/probot/probot) that provides automatic semantic versioning support.

## Features

When you publish a [release](https://help.github.com/articles/creating-releases/):

* The milestone for the release is automatically closed.
* Milestones for the next major, minor, and patch releases are automatically created, if they don't yet exist.

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.
