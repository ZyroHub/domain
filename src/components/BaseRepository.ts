import { EntityId } from '@/types/entity.js';
import { Repository } from '@/types/repository.js';

import { Entity } from './Entity.js';

export abstract class BaseRepository<TEntity extends Entity<any, any, any>> implements Repository<TEntity> {
	abstract create(entity: TEntity): Promise<TEntity | void>;
	abstract update(entity: TEntity): Promise<TEntity | void>;
	abstract delete(id: EntityId): Promise<boolean>;

	async save(entity: TEntity): Promise<TEntity | void> {
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
