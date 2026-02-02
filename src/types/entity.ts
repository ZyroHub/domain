export interface EntityToObjectOptions {
	view?: string;

	[key: string]: any;
}

export type EntityId = string | number;

export interface EntityOptions<TEntityData, TEntityRelations = {}, TEntityId = EntityId> {
	id?: TEntityId;
	idGenerator?: () => TEntityId;
	data: TEntityData;
	relations?: TEntityRelations;
	createdAt?: Date;
	updatedAt?: Date;
	exists?: boolean;
}
