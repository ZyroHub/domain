<div align="center">
    <img src="https://i.imgur.com/KVVR2dM.png">
</div>

## ZyroHub - Domain

This package contains the domain logic of the applications. It defines the essential entities, and repositories that form the foundation of an application.

## Table of Contents

- [ZyroHub - Domain](#zyrohub---domain)
- [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
- [Entities](#entities)
    - [Creating a Basic Entity](#creating-a-basic-entity)
    - [Custom ID Generation](#custom-id-generation)
    - [Entity Relations](#entity-relations)
    - [Customizing Entity Output with filterObject](#customizing-entity-output-with-filterobject)
    - [Collecting list of changes](#collecting-list-of-changes)
    - [Group of Entities (EntityGroup)](#group-of-entities-entitygroup)
        - [Getting an Entity by ID](#getting-an-entity-by-id)
        - [Removing an Entity by ID](#removing-an-entity-by-id)
- [Repositories](#repositories)
    - [Defining the Repository Interface](#defining-the-repository-interface)
    - [Creating a Repository](#creating-a-repository)
    - [Repository Example Usage](#repository-example-usage)
        - [Save](#save)
        - [Create](#create)
        - [Update](#update)
        - [Delete](#delete)

## Getting Started

To install the domain package, use one of the following package managers:

[NPM Repository](https://www.npmjs.com/package/@zyrohub/domain)

```bash
# npm
npm install @zyrohub/domain
# yarn
yarn add @zyrohub/domain
# pnpm
pnpm add @zyrohub/domain
# bun
bun add @zyrohub/domain
```

## Entities

### Creating a Basic Entity

```typescript
import { Entity } from '@zyrohub/domain';

export interface UserEntityRaw {
	id?: string; // optional id, for not existing users
	name: string;
	email: string;
	password: string;
}

export class UserEntity extends Entity<UserEntityRaw> {
	constructor(raw: UserEntityRaw) {
		super({
			data: raw
		});
	}

	// Filter out sensitive data or modify the output as needed (see section "#Customizing Entity Output with filterObject")
	filterObject(data: any, options: any): any {
		delete data.password; // Exclude password from the output

		return data;
	}
}

const user = new UserEntity({
	id: '1',
	name: 'John Doe',
	email: 'john.doe@example.com',
	password: 'securepassword'
});

// raw data: { id: '1', name: 'John Doe', email: 'john.doe@example.com', password: 'securepassword' }
// unwrap() returns the clean raw data (POJO) useful for database persistence, etc.
console.log(user.unwrap());

// processed data without password (to expose in public or other scenarios): { id: '1', name: 'John Doe', email: 'john.doe@example.com' }
console.log(user.toObject());
```

### Custom ID Generation

```typescript
import { Entity } from '@zyrohub/domain';
import { randomUUID } from 'crypto';

export interface UserEntityRaw {
	id?: string; // optional id, for not existing users
	name: string;
	email: string;
	password: string;
}

export class UserEntity extends Entity<UserEntityRaw> {
	constructor(raw: UserEntityRaw) {
		super({
			idGenerator: () => randomUUID(), // Custom ID generator for non-existing users
			data: raw
		});
	}
}
```

### Entity Relations

You can define relations between entities by creating interfaces for the related entities and including them in the main entity's raw data and relations.

```typescript
import { Entity } from '@zyrohub/domain';

import { UserEntity, UserEntityRaw } from './UserEntity.js';

// Post entity without relations
export interface PostEntityData {
	id: string;
	title: string;
	content: string;
	authorId: string;
}

// Post entity with relations merged
export interface PostEntityRaw extends PostEntityData {
	author?: UserEntityRaw;
}

// Post entity relations interface
export interface PostEntityRelations {
	author?: UserEntity;
}

export class PostEntity extends Entity<PostEntityRaw, PostEntityRelations> {
	constructor(raw: PostEntityRaw) {
		// Destructure to separate relations from raw data
		const { author, ...data } = raw;

		super({
			data: data,
			// Map relations to their respective entity instances
			relations: {
				author: author ? new UserEntity(author) : undefined
			}
		});
	}
}

const post = new PostEntity({
	id: '101',
	title: 'My First Post',
	content: 'Content',
	authorId: '1',
	author: {
		id: '1',
		name: 'John Doe',
		email: 'john.doe@example.com'
	}
});

console.log(post.toObject());
// Output: {
//  id: '101',
//  title: 'My First Post',
//  content: 'Content',
//  authorId: '1',
//  relations: {
//    author: { id: '1', name: 'John Doe', email: 'john.doe@example.com' }
//  }
// }
```

### Customizing Entity Output with filterObject

You can customize the output of an entity by overriding the `filterObject` method. This allows you to modify the data before it is returned by the `toObject` method.

```typescript
import { Entity, EntityToObjectOptions } from '@zyrohub/domain';

export interface UserEntityRaw {
	id: string;
	name: string;
	email: string;
	password: string;
	age: number;
}

export interface UserEntityToObjectOptions extends EntityToObjectOptions {
	// view: string; is automatically included in EntityToObjectOptions interface (you can use "admin", "public", etc. if needed)

	// Add any additional options specific to UserEntity here
	includeAge?: boolean;
}

export class UserEntity extends Entity<UserEntityRaw> {
	constructor(raw: UserEntityRaw) {
		super({
			data: raw
		});
	}

	filterObject(data: any, options: UserEntityToObjectOptions): any {
		// Exclude password from the output
		delete data.password;

		// Conditionally include age based on options
		if (!options.includeAge) {
			delete data.age;
		}

		// Using different views (if needed)
		if (options.view !== 'admin') {
			delete data.email; // Exclude email in public view
		}

		return data;
	}
}

// Example usage
const user = new UserEntity({
	id: '1',
	name: 'John Doe',
	email: 'john.doe@example.com',
	password: 'securepassword',
	age: 30
});

// Default view without age
console.log(user.toObject({ view: 'default' })); // { id: '1', name: 'John Doe' }
// Default view with age
console.log(user.toObject({ view: 'default', includeAge: true })); // { id: '1', name: 'John Doe', age: 30 }
// Admin view with age
console.log(user.toObject({ view: 'admin', includeAge: true })); // { id: '1', name: 'John Doe', email: 'john.doe@example.com', age: 30 }
// Admin view without age
console.log(user.toObject({ view: 'admin' })); // { id: '1', name: 'John Doe', email: 'john.doe@example.com' }
```

### Collecting list of changes

The Entity class tracks changes made to its data. You can retrieve the list of changes using the `getChanges` method and reset the changes tracker with the `commit` method.

```typescript
import { UserEntity } from './UserEntity.js';

const user = new UserEntity({
	id: '1',
	name: 'John Doe',
	email: 'john.doe@example.com',
	password: 'securepassword',
	age: 30
});

user.data.name = 'Jane Doe';
user.data.age = 31;

console.log(user.getChanges()); // { name: 'Jane Doe', age: 31 }

// do something with the changes...

user.commit(); // resets the changes tracker
```

### Group of Entities (EntityGroup)

You can manage a collection of entities using the `EntityGroup` class. This class provides methods to manipulate and access multiple entities as a group.

⚠️ **Note:** The `EntityGroup` class is a extension of the native JavaScript `Array` class, so you can use all standard array methods on it. (e.g., `map`, `filter`, `forEach`, etc.)

```typescript
import { EntityGroup } from '@zyrohub/domain';

import { UserEntity } from './UserEntity.js';

// Creating an EntityGroup from a list of UserEntity instances
const usersGroupFromEntities = EntityGroup.fromList([
	new UserEntity({
		id: '1',
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'securepassword',
		age: 30
	}),
	new UserEntity({
		id: '2',
		name: 'Jane Smith',
		email: 'jane.smith@example.com',
		password: 'anothersecurepassword',
		age: 25
	})
]);

// Creating a new EntityGroup directly from raw data (database data)
// Entity automatically add the fromList static method to create groups from raw data
const usersGroupFromRaw = UserEntity.fromList([
	{
		id: '1',
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'securepassword',
		age: 30
	},
	{
		id: '2',
		name: 'Jane Smith',
		email: 'jane.smith@example.com',
		password: 'anothersecurepassword',
		age: 25
	}
]);
```

#### Getting an Entity by ID

You can retrieve an entity from the group by its ID using the `getById` method.

```typescript
const user = usersGroup.getById('1');

console.log(user); // UserEntity instance for John Doe
```

#### Removing an Entity by ID

You can remove an entity from the group by its ID using the `removeById` method.

```typescript
usersGroup.removeById('2');

console.log(usersGroup.length); // 1 (only John Doe remains)
```

## Repositories

### Defining the Repository Interface

First, define the repository interface for your entity by extending the generic `Repository` interface from the domain package.

```typescript
import { Repository } from '@zyrohub/domain';

import { UserEntity } from './UserEntity.js';

export interface UserRepository extends Repository<UserEntity> {
	// "Repository" interface already includes as required the methods:
	// create(entity: TEntity): Promise<TEntity | void>;
	// update(entity: TEntity): Promise<TEntity | void>;
	// delete(id: EntityId): Promise<boolean>;

	// Define custom methods for UserRepository here
	findByEmail(email: string): Promise<UserEntity | null>;
}
```

### Creating a Repository

Then, implement the repository by extending the `BaseRepository` class and implementing your repository interface.

```typescript
import { BaseRepository } from '@zyrohub/domain';

import { UserEntity } from './UserEntity.js';
import { UserRepository } from './UserRepository.js';

// An example implementation of UserRepository using an in-memory array
export class InMemoryUserRepository extends BaseRepository<UserEntity> implements UserRepository {
	// In-memory user storage (for demonstration purposes)
	private users: UserEntity[] = [];

	// Required method from Repository interface
	async create(entity: UserEntity): Promise<void | UserEntity> {
		this.users.push(entity.unwrap()); // store raw data of the entity
		entity.commit(); // commit changes after creation

		return entity;
	}

	// Required method from Repository interface
	async update(entity: UserEntity): Promise<void | UserEntity> {
		const index = this.users.findIndex(user => user.id === entity.id);

		if (index !== -1) {
			this.users[index] = {
				...this.users[index],

				...entity.getChanges() // apply only changes
			};

			entity.commit(); // commit changes after update

			return entity;
		} else {
			throw new Error('User not found');
		}
	}

	// Required method from Repository interface
	async delete(id: string): Promise<boolean> {
		this.users.splice(
			this.users.findIndex(user => user.id === id),
			1
		);

		return true;
	}

	// Your custom methods from UserRepository interface
	async findByEmail(email: string): Promise<UserEntity | null> {
		const user = this.users.find(user => user.data.email === email);

		return user || null;
	}
}
```

### Repository Example Usage

#### Save

The `BaseRepository` class provides a `save` method that automatically detects whether to create a new entity or update an existing one based on the entity's `exists` property.

```typescript
import { InMemoryUserRepository } from './InMemoryUserRepository.js';

const userRepository = new InMemoryUserRepository();

const user = new UserEntity({
	id: '1',
	name: 'John Doe',
	email: 'john.doe@example.com',
	password: 'securepassword',
	age: 30
});

await userRepository.save(user); // auto-detects create or update using "entity.exists" property
```

#### Create

You can create a new entity using the `create` method provided by the `BaseRepository` class. (if you want to explicitly create without `save` auto-detection)

```typescript
import { InMemoryUserRepository } from './InMemoryUserRepository.js';

const userRepository = new InMemoryUserRepository();

const user = new UserEntity({
	name: 'John Doe',
	email: 'john.doe@example.com',
	password: 'securepassword',
	age: 30
});

const createdUser = await userRepository.create(user); // returns the created UserEntity instance if you want to use it
```

#### Update

You can update an existing entity using the `update` method provided by the `BaseRepository` class. (if you want to explicitly update without `save` auto-detection)

```typescript
import { InMemoryUserRepository } from './InMemoryUserRepository.js';

const userRepository = new InMemoryUserRepository();

const user = await userRepository.findByEmail('john.doe@example.com');

if (user) {
	user.data.name = 'Jane Doe';

	await userRepository.update(user); // returns the updated UserEntity instance if you want to use it
}
```

#### Delete

You can delete an entity using the `delete` method provided by the `BaseRepository` class.

```typescript
import { InMemoryUserRepository } from './InMemoryUserRepository.js';

const userRepository = new InMemoryUserRepository();

const success = await userRepository.delete('1'); // returns true if deletion was successful
```
