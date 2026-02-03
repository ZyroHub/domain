import { EntityId } from '@/types/entity.js';

import { BaseRepository } from './BaseRepository.js';
import { Entity } from './Entity.js';

export class InMemoryRepository<TEntity extends Entity<any>> extends BaseRepository<TEntity> {
	public items: TEntity[] = [];

	async create(entity: TEntity): Promise<TEntity | void> {
		this.items.push(entity);

		return entity;
	}

	async update(entity: TEntity): Promise<void | TEntity> {
		const index = this.items.findIndex(item => item.id === entity.id);
		if (index === -1) return;

		this.items[index] = entity;
		return entity;
	}

	async delete(id: EntityId): Promise<boolean> {
		const index = this.items.findIndex(item => item.id === id);
		if (index === -1) return false;

		this.items.splice(index, 1);
		return true;
	}
}
