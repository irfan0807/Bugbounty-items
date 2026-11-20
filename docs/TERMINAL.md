# SkyNet ttyd practice terminal

The learning terminal embeds ttyd from a disposable Docker container. It is a real shell inside that container; it does not run commands on the host.

## Start

1. Install and start Docker Desktop (or Docker Engine with Compose).
2. From the project root, run `npm run terminal:up`.
3. Run `npm run dev` and open the SkyNet map.
4. Open the terminal with **Open practice terminal** or right-click the right half of the map.

Use `npm run terminal:down` to stop and remove the terminal container.

## Isolation

- The service publishes port 7681 on `127.0.0.1` only.
- Its Docker network is internal, so the shell has no network egress.
- No host paths or Docker socket are mounted into the container.
- The container runs as an unprivileged user with a read-only root filesystem, a temporary `/tmp`, dropped Linux capabilities, and CPU, memory, and process limits.
- Closing the embedded terminal disconnects the client. ttyd is configured to end that shell session; Docker starts a fresh session for the next open.

The app points to `http://127.0.0.1:7681/`. Do not publish this port on a public interface or change the setup to mount host files. This configuration is for local practice; a deployed app needs a separately reviewed, authenticated sandbox service and a secure reverse proxy.

The app embeds ttyd using its supported web terminal interface. ttyd's `-W` option enables terminal input, `-O` checks WebSocket origin, and `-o` exits the session on disconnect. See the [ttyd manual](https://github.com/tsl0922/ttyd/blob/main/man/ttyd.man.md).
