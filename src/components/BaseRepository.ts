import { EntityId } from '@/types/entity.js';
import { Repository } from '@/types/repository.js';

import { Entity } from './Entity.js';

export abstract class BaseRepository<TEntity extends Entity<any, any, any>> implements Repository<TEntity> {
	abstract create(entity: TEntity): Promise<void>;
	abstract update(entity: TEntity): Promise<void>;
	abstract delete(id: EntityId): Promise<boolean>;

	async save(entity: TEntity): Promise<void> {
		if (entity.exists) {
			if (!entity.isDirty()) return;
			await this.update(entity);
		} else {
			await this.create(entity);
		}
	}
}
