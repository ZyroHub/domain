import { EntityId } from '@/types/entity.js';

import { BaseRepository } from './BaseRepository.js';
import { Entity } from './Entity.js';

export class InMemoryRepository<TEntity extends Entity<any>> extends BaseRepository<TEntity> {
	public items: TEntity['data'][] = [];

	async create(entity: TEntity): Promise<void> {
		this.items.push(entity.unwrap());

		entity.exists = true;
		entity.commit();
	}

	async update(entity: TEntity): Promise<void> {
		const index = this.items.findIndex(item => item.id === entity.id);
		if (index === -1) return;

		this.items[index] = {
			...this.items[index],
			...entity.getChanges()
		};

		entity.commit();
	}

	async delete(id: EntityId): Promise<boolean> {
		const index = this.items.findIndex(item => item.id === id);
		if (index === -1) return false;

		this.items.splice(index, 1);
		return true;
	}

	async clear(): Promise<void> {
		this.items = [];
	}
}
