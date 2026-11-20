# SkyNet contextual ChatGPT tutor

Lesson and CWE details include an **Ask ChatGPT to explain this** panel. SkyNet builds a focused prompt from the selected class or CWE entry and the visible lesson guidance. The learner can copy that prompt and open ChatGPT in a separate tab.

SkyNet does not send lesson content to a model from the app, and no API key is placed in the browser bundle. To open a custom GPT instead, copy `.env.example` to `.env.local` and set `VITE_SKYNET_CHATGPT_URL` to the share URL for that GPT. The URL is public configuration; never place an API secret in a `VITE_` variable.
