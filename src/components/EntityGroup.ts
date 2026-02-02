import { Entity } from './Entity.js';

export class EntityGroup<T extends Entity<any, any, any, any>> extends Array<T> {
	constructor(items?: number | T[]) {
		if (typeof items === 'number') {
			super(items);
		} else {
			super(...(items || []));
		}

		Object.setPrototypeOf(this, EntityGroup.prototype);
	}

	add(...items: T[]): this {
		this.push(...items);

		return this;
	}

	removeById(id: unknown): boolean {
		const index = this.findIndex(item => String(item.id) === String(id));

		if (index !== -1) {
			this.splice(index, 1);

			return true;
		}

		return false;
	}

	findById(id: unknown): T | undefined {
		return this.find(item => String(item.id) === String(id));
	}

	toObject(options?: Parameters<T['toObject']>[0]): ReturnType<T['toObject']>[] {
		return this.map(item => item.toObject(options as any));
	}

	toJSON(): any {
		return this.toObject({ view: 'default' } as any);
	}
}
