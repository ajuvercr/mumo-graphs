import { Client, type Config, type Member, type Ordered } from 'ldes-client';
import { fetch_f } from './utils';
import { type NodeInstance, NodeInstanceLens } from './configs';
import { browser } from '$app/environment';
import { type Writable, writable } from 'svelte/store';
import { Writer } from 'n3';

export type Instance = {
    client: Client;
    stream: ReadableStreamDefaultReader<Member>;
    members: Member[];
    callBacks: Array<(member: Member) => Promise<void>>;
};

const utils: {
    [id: string]: LdesUtils;
} = {};
export async function getUtils(url: string): Promise<LdesUtils> {
    if (utils[url]) return utils[url];

    utils[url] = new LdesUtils(url);
    await utils[url].init;
    return utils[url];
}

export class LdesUtils {
    factory: Factory;
    init: Promise<void>;

    instances: {
        [id: string]: Instance;
    } = {};

    constructor(url: string) {
        this.factory = new Factory({
            url,
            fetch: fetch_f()
        });
        this.init = this.factory.init();
    }

    get(config: Partial<Config>, order: Ordered, saveMembers: boolean): Instance {
        const key = JSON.stringify({
            order,
            condition: config.condition?.toString(),
            after: config.after,
            before: config.before
        });
        if (this.instances[key]) {
            return this.instances[key];
        }
        const client = this.factory.build(config, order);

        const out: Instance = {
            client,
            stream: client.stream().getReader(),
            members: [],
            callBacks: []
        };

        (async () => {
            let mem = await out.stream.read();
            while (mem && !mem.done) {
                if (saveMembers) out.members.push(mem.value);
                for (let cb of out.callBacks) {
                    await cb(mem.value);
                }

                mem = await out.stream.read();
            }
        })();

        this.instances[key] = out;

        return out;
    }
}

export const FoundNodes: Writable<NodeInstance[]> = writable([]);
if (browser) {
    (async () => {
        const utils = await getUtils('https://mumo.ilabt.imec.be/nodes/default');
        const instance = utils.get({}, 'none', true);
        instance.callBacks.push(async (mem) => {
            const node = NodeInstanceLens.execute(mem);
            if (node.instance.title == 'test') {
                return;
            }
            if (node.instance.title == 'mumo-v2-007') {
                const writer = new Writer({ format: 'text/turtle' });
                writer.addQuads(mem.quads);
                writer.end(console.log);
            }
            FoundNodes.update((ns) => {
                ns.push(node);
                return ns;
            });
        });
    })();
}

export const dataFactory: Factory = browser
    ? new Factory({
        url: 'https://mumo.ilabt.imec.be/ldes/default',
        fetch: fetch_f()
    })
    : ({} as Factory);
