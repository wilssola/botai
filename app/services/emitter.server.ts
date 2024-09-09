import { EventEmitter } from "events";
import { MAX_LISTENERS } from "../../server";

let emitter: EventEmitter;

if (process.env.NODE_ENV === "production") {
  emitter = new EventEmitter();
  emitter.setMaxListeners(MAX_LISTENERS);
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = global as any;
  if (!g.__emitter) {
    g.__emitter = new EventEmitter();
    g.__emitter.setMaxListeners(MAX_LISTENERS);
  }
  emitter = g.__emitter;
}

export { emitter };
