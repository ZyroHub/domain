import { Objects } from '@zyrohub/utilities';

export interface EntityToObjectOptions {
	view?: string;

	[key: string]: any;
}

export interface EntityOptions<TEntityData, TEntityRelations = {}, TEntityId = string> {
	id?: TEntityId;
	idGenerator?: () => TEntityId;
	data: TEntityData;
	relations?: TEntityRelations;
	createdAt?: Date;
	updatedAt?: Date;
}

export abstract class Entity<
	TEntityData extends object,
	TEntityRelations extends object = {},
	TEntityToObjectOptions extends EntityToObjectOptions = EntityToObjectOptions,
	TEntityId = string
> {
	protected _id: TEntityId | undefined;
	protected _createdAt: Date;
	protected _updatedAt: Date;

	protected readonly _rawData: TEntityData;
	public readonly data: TEntityData;

	public readonly relations: TEntityRelations;

	private proxyCache = new WeakMap<object, any>();
	private _changes: Partial<TEntityData> = {};

	constructor(protected options: EntityOptions<TEntityData, TEntityRelations, TEntityId>) {
		this._id = options.id ?? (options.idGenerator ? options.idGenerator() : (undefined as unknown as TEntityId));
		this._createdAt = options.createdAt || new Date();
		this._updatedAt = options.updatedAt || new Date();

		this._rawData = options.data;
		this.data = this.createProxy(this._rawData);

		this.relations = options.relations || ({} as TEntityRelations);
	}

	get id() {
		return this._id;
	}

	public setId(id: TEntityId): void {
		this._id = id;
	}

	private createProxy<T extends object>(target: T, rootKey?: keyof TEntityData): T {
		return new Proxy(target, {
			set: (obj, prop, value) => {
				const key = prop as keyof T;
				const previousValue = Reflect.get(obj, key);

				if (!Objects.isEqual(previousValue, value)) {
					const result = Reflect.set(obj, prop, value);
					const dirtyKey = (rootKey || prop) as keyof TEntityData;

					this.markAsDirty(dirtyKey);

					return result;
				}

				return Reflect.set(obj, prop, value);
			},
			get: (obj, prop) => {
				const value = Reflect.get(obj, prop);

				if (value && typeof value === 'object') {
					if (value instanceof Date) return value;

					if (this.proxyCache.has(value)) {
						return this.proxyCache.get(value);
					}

					const currentRootKey = (rootKey || prop) as keyof TEntityData;
					const nestedProxy = this.createProxy(value, currentRootKey);

					this.proxyCache.set(value, nestedProxy);
					return nestedProxy;
				}

				return value;
			}
		});
	}

	public toObject(
		options: TEntityToObjectOptions = {} as TEntityToObjectOptions
	): TEntityData & TEntityRelations & { id: TEntityId } {
		const relationsJSON: Record<string, any> = {};

		for (const [key, value] of Object.entries(this.relations)) {
			if (value === undefined || value === null) {
				relationsJSON[key] = value;
				continue;
			}

			if (typeof value === 'object' && 'toObject' in value && typeof (value as any).toObject === 'function') {
				relationsJSON[key] = (value as any).toObject(options);
			} else if (Array.isArray(value)) {
				relationsJSON[key] = value.map((v: any) =>
					v && typeof v.toObject === 'function' ? v.toObject(options) : v
				);
			} else {
				relationsJSON[key] = value;
			}
		}

		const plainData = Objects.clone(this._rawData);

		const builtObject = {
			id: this._id,
			...plainData,
			relations: relationsJSON,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};

		return this.filterObject(builtObject, options);
	}

	protected filterObject(data: any, options: TEntityToObjectOptions): any {
		return data;
	}

	public toJSON(): any {
		return this.toObject({ view: 'default' } as TEntityToObjectOptions);
	}

	private markAsDirty(key: keyof TEntityData) {
		this._changes[key] = this._rawData[key];
		this._updatedAt = new Date();
	}

	public getChanges() {
		return this._changes;
	}

	public isDirty() {
		return Object.keys(this._changes).length > 0;
	}

	public commit() {
		this._changes = {};
	}
}
