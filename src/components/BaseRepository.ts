import { EntityId } from '@/types/entity.js';
import { Repository } from '@/types/repository.js';

import { Entity } from './Entity.js';

export abstract class BaseRepository<T extends Entity<any, any, any>> implements Repository<T> {
	abstract create(entity: T): Promise<T | void>;
	abstract update(entity: T): Promise<T | void>;
	abstract delete(id: EntityId): Promise<void>;

	async save(entity: T): Promise<T | void> {
		if (entity.exists) {
			if (!entity.isDirty()) return entity;
			const updatedEntity = await this.update(entity);

			entity.commit();

			return updatedEntity || entity;
		} else {
			const createdEntity = await this.create(entity);

			entity.exists = true;
			entity.commit();

			return createdEntity || entity;
		}
	}
}
