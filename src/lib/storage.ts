import type { IStorage } from '@inrupt/solid-client-authn-node';

const internal: { [id: string]: string } = {};
const verbose = false;
export const Storage: IStorage = {
	get: async (key: string) => {
		if (verbose) {
			console.log('Get', key, internal[key]);
		}
		return internal[key];
	},
	set: async (key: string, value: string) => {
		if (verbose) {
			console.log('Set', key, value);
		}
		internal[key] = value;
	},
	delete: async (key: string) => {
		if (verbose) {
			console.log('Delete', key, internal[key]);
		}
		delete internal[key];
	}
};

type FnToCall<F extends (...args: any) => Promise<any>> = {
	resolve: (ret: ReturnType<F>) => void;
	reject: (e: unknown) => void;
	fnToCall: F;
	args: Parameters<F>;
};

export class Semaphore {
	private currentRequests: FnToCall<any>[];
	private runningRequests: number;
	private maxConcurrentRequests: number;

	constructor(maxConcurrentRequests = 1) {
		this.currentRequests = [];
		this.runningRequests = 0;
		this.maxConcurrentRequests = maxConcurrentRequests;
	}

	callFunction<F extends (...args: any) => Promise<any>>(fnToCall: F, ...args: Parameters<F>) {
		return new Promise((resolve, reject) => {
			this.currentRequests.push({
				resolve,
				reject,
				fnToCall,
				args
			});
			this.tryNext();
		});
	}

	tryNext() {
		if (!this.currentRequests.length) {
			return;
		} else if (this.runningRequests < this.maxConcurrentRequests) {
			let { resolve, reject, fnToCall, args } = this.currentRequests.shift()!;
      console.log("semaphore is not full", this.runningRequests, this.currentRequests);
			this.runningRequests++;
			let req = fnToCall(...args);
			req
				.then((res: any) => resolve(res))
				.catch((err: any) => reject(err))
				.finally(() => {
					this.runningRequests--;
					this.tryNext();
				});
		} else {
      console.log("semaphore is full")
    }
	}
}

export const LDESThrottler = new Semaphore(1);
