# LayerAkira Order Book Frontend Task

## Setup instructions
1. Install dependencies: `pnpm install`
2. Copy the `.env.example` file to `.env` and fill in the required environment variables. 
3. Run the application locally: `pnpm dev`

## Arquitectural Approach
### Tech Stack
- React
- TailwindCSS
- Vite
- Typescript

### Project Structure
The project has the following structure:
- `src`: All the source code of the application.
  - `compoents`: All the components of the application.
  - `styles:`: All the styles of the application.
  - `utils`: All the utilities of the application.
  - `types`: All the types of the application.

### Component design 
The application is made with six components:
- `App`: This component is the root component of the application. (In theory, it is `main.tsx`, but that file remained untouched)
- `OrderBookContainr`: This component is the main component of the application, which encapulses all the other components.
- `OrderBookDisplay`: This component is responsible for displaying the order book.
- `OrderBookList` : This component is responsible for displaying the list of orders, for asks and bids.
- `OrderBookRow` : This component is responsible for displaying a single row of the order book.
- `VolumeBar` : This component is responsible for displaying the volume bar of each order.

The HTTP Client is initialized in the `App` component, and the first batch of data is fetched in the `OrderBookContainer` component.

The WebSocket Client is initialized in the `OrderBookContainer` component, which handles the connection and the subscription to the WebSocket.

All the data is being passed as a prop to the `OrderBookDisplay` component, which is responsible for displaying the order book, along with the other components. 

Most of the types needed are being defined in the `types` folder and functions for formatting and sorting the data are being defined in the `utils` folder.

The state of the application is managed by React's `useState` hook.

The state is being passed as a prop to the components, which are responsible for updating the state.

### Improvements with more time
Due to being first time using web sockets a lot of time was lost in understanding and fixing human errors due to misunderstanding of concepts of the `Layer Akira SDK`, there are some improvements that could be made with more time:

- Handling the connection more efficiently with a context provider for both clients, HTTP and WebSocket.
- Add a theme toggle with a context provider, having both styles for light and dark mode.
- Add the Spread component, which was initially planned but unable to do so. Tried to stick to the 10 hours specified in the time commitment.
- Take a better look at the codebase to make it more readable and ensure all the functions regarding data processing are being stored in a single file for better organization and maintainability.
- Make the UI a bit more engaging for a user, and not so dry and boring.

## Time slots
The following were the time slots spent on the task:

### Monday 28th April

17:00-17:15: Research of order books \
17:15-17:45: Component ideation and project structure \
17:45-18:15: Getting familiar with the SDK (knowing how to auth and how to handle WebSockets) \
18:15-19:16: Initial implementation of different components and yolo SDK logic to fetch snapshot and keep WS connection. \
19:17-20:10: Reading the starknet-js sdk and understanding the flow of auth properly. \
20:10-20:22: Testing the application, ran into 502 Bad Gateway errors when doing Auth. \
21:20-21:35: Fix TailwindCSS not rendering properly due to misconfiguration. \

### Tuesday 29th April

1:40-2:10: Create mock data and start fixing UI to display correctly. (most of the UI was coded without seeing the components at first) \
2:50-3:50: Ask questions to Miko and get auth + snapshot working.

### Wednesday 30th April

15:50-16:50: Format numbers from the snapshot and ask questions to Miko, regarding precision and websocket stream. \
23:20-00:15: Implement websocket connection (however not receiving any updates). Fix VolumeBar to display the volume properly.

### Thursday 1st May

00:15-2:00: Figure out why websocket connecting was looping. It was due to misconfiguration of credentials in HTTP Client of SDK. \
2:00-3:00: Fix websocket subscription. Errors were due to not having proper handling of the connection and wrong boolean value on ticker. \
3:00-3:30: Small improvements to UI for final submission. \
3:30-3:50: Creation of README for final submission. \

## Conclusions
The task was a bit challenging, due to the lack of experience with web sockets and the SDK. Also, from the lack of knowledge of how order books were built or what do they represent exactly. The lack of proper frontend experience was also challenging, but an amazing learning experience nonetheless.
After all, it was a very fun task. I learned a lot during the process and I'm deeply grateful to Miko for answering all my questions and all the help offered. I'm also grateful to Mickey for giving me the opportunity to work on the task. 