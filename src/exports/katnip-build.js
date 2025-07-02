import path from "node:path";
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function build(buildEvent) {
	buildEvent.addServerModule(path.join(__dirname,"../main/server.js"));
	buildEvent.addClientWrapper(path.join(__dirname,"../main/PaymentWrapper.jsx"));
}