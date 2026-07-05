
# JSON Resume Editor

Local visualization tool for [JSON Resume](https://jsonresume.org/).

Big library of themes to choose from:

![Preview 4 col](images/ss-4-cols.png)

After you select a theme, you can see the live preview:

![Preview 1 col](images/ss-1-col.png)


## Getting Started

1.  Install & Run

```bash
npm install && npm start
```
Opens editor at `http://localhost:5173`.

2.  Themes:
    - Many popular themes (like `elegant`, `flat`, `modern`, etc.) are already pre-installed under dependencies in `package.json` and loaded automatically.
    - To add a new/different theme:
      ```bash
      npm install jsonresume-theme-<name>
      ```
      (Restart the server to load the new theme).

## ToDo

- think about scrolling logic (I wanna see how it would look like on pdf with pages + I have to be able to click to select + i should be able to click on links from pdf)
- refactor by hand to lean React properly
- figure out why image doesn't work
- upload image
- click on text on the right and select on the left (like latex)
- make my own theme + allow which things to show