import { Entity } from '@/components/Entity.js';

import { EntityId } from './entity.js';

export interface Repository<T extends Entity<any, any, any>> {
	save(entity: T): Promise<void>;

	create(entity: T): Promise<void>;
	update(entity: T): Promise<void>;
	delete(id: EntityId): Promise<void>;
}
