import { Repository } from '@/types/repository.js';

import { Entity } from './Entity.js';

export abstract class BaseRepository<T extends Entity<any, any, any>> implements Repository<T> {
	abstract create(entity: T): Promise<void>;
	abstract update(entity: T): Promise<void>;
	abstract delete(id: any): Promise<void>;

	async save(entity: T): Promise<void> {
		if (entity.exists) {
			if (!entity.isDirty()) return;
			await this.update(entity);

			entity.commit();
		} else {
			await this.create(entity);

			entity.exists = true;
			entity.commit();
		}
	}
}
