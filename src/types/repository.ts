import { Entity } from '@/components/Entity.js';

import { EntityId } from './entity.js';

export interface Repository<T extends Entity<any, any, any>> {
	save(entity: T): Promise<T | void>;

	create(entity: T): Promise<T | void>;
	update(entity: T): Promise<T | void>;
	delete(id: EntityId): Promise<boolean>;
}
