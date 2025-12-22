import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";

const model = gemini({ model: "gemini-2.5-flash" });


export const helloWorld = inngest.createFunction(
    { id: 'hello-world' },
    { event: 'agent/hello' },
    async ({ event, step }) => {
        const helloAgent = createAgent({
            name: "hello-agent",
            description: "A simple agent that greets the user",
            model,
            system: () => "You are a helpful assistant.",

        })

        const { output } = await helloAgent.run("Hello, how are you?");
        return {
            message: output[0].content
        }
    }

);
