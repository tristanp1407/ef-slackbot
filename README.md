# Slack Bolt - Course booking app

Built with [Slack's Bolt Framework](https://slack.dev/bolt/tutorial/getting-started) for node.js.

---

### Slack API & features used in the app

- The [`app_home_opened`](https://api.slack.com/events/app_home_opened) event gets triggered when a user opens the bot's "app home" for the first time
- 

### Requirements

- A Bot User must be added to your App
- Your App must be subscribed to [Events API](https://api.slack.com/events-api)
- Your app needs to be subscribed to the events mentioned in the _Events_ section

### Scopes

- [`chat:write`](https://api.slack.com/scopes/chat:write)

### Events

#### Workspace events

- [`app_home_opened`](https://api.slack.com/events/app_home_opened)
