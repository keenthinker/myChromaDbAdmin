# myChromaDbAdmin

**Simple user-friendly Chroma database administration WebUI.**

![Image](./documentation/myChromaDbAdmin-11.png)

## Disclaimer
This is an independent personal project not affiliated with or sponsored by [Chroma](https://www.trychroma.com/).

## Overview

The myChromaDbAdmin is a webpage that helps you navigate, manage, and interact with your data stored in the Chroma database.

## Why is it called myChromaDbAdmin?
The name **myChromaDbAdmin** is directly inspired by [phpMyAdmin](https://www.phpmyadmin.net/), a tool I frequently use and admire. Just as phpMyAdmin provides a powerful web interface for managing MySQL/MariaDb databases, this app aims to provide the same ease of use and accessibility for ChromaDB. 🙂

## Prerequisites

- A running instance of Chroma database. You can find installation instructions on the [Chroma GitHub Repository](https://github.com/chroma-core/chroma).

## Features

- View and manage (create, delete, rename) collections and collections metadata in your Chroma database.
- Browse and manage (add, edit, clone, delete) documents content and metadata within collections.

## Tech Stack

- Frontend: 
    - HTML (EJS)
    - CSS (Tailwind CSS)
    - JavaScript (Alpine.js)
- Backend: 
    - Node.js
    - Express.js
    - The Chroma [npm package](https://docs.trychroma.com/docs/overview/getting-started?lang=typescript)

## Motivation
While working with ChromaDb locally, I found that the official TUI client had several limitations: 

- it can only open one collection at a time from a local instance
- it lacks the ability to modify existing collections or documents

I developed this web app to provide a more flexible solution for browsing, inspecting, and managing vector store content directly from a browser.

## Installation

1. Clone the repository and install the dependencies:
   ```bash
    npm install
    ```
2. Build the styling and start the application:
   ```bash
   npm run tailwind:css
   npm run start
   ```
3. Open your web browser and navigate to `http://localhost:3000` to access the myChromaDbAdmin interface.

## Usage and features

You can find a detailed description and numerous screenshots in the [Documentation](https://github.com/keenthinker/myChromaDbAdmin/blob/main/documentation/Documentation.md) folder.


## Roadmap

The following items outline planned improvements and features for upcoming releases:

- [x] Integrate TailwindCSS properly into the project (MVP is using the CDN)
- [ ] Make the database server address and port configurable
- [ ] Support multiple databases and tenants (not limited to defaults)
- [x] Improve collection ordering in the sidebar (sort alphabetically)
- [x] Fix metadata key/value handling:
  - Allow newly added metadata keys to start empty
  - Metadata key/value pairs sorted alphabetically by key
- [ ] Improve accessibility:
  - Correct tab order
  - Add useful keyboard shortcuts
- [x] Implement user management (1): login/authentication
- [ ] Implement user management (2): basic access control (e.g. restrict users to specific collections)
- [ ] Add internationalization (i18n) and translation support


## Feedback, Issues and Support

I'd love to hear your honest feedback on the app, positive or critical, and the reasons behind it. Feedback, questions, and ideas are very welcome. 🙂

- For bugs, feature requests, or concrete improvements, please use [GitHub Issues](https://github.com/keenthinker/myChromaDbAdmin/issues) so everything stays transparent and trackable.
- If you have feedback, general questions, need help with a specific setup, or prefer a more direct conversation, feel free to reach out to me outside of GitHub as well.


## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

The myChromaDbAdmin is licensed under the [MIT License](LICENSE). Feel free to use and modify it according to your needs.