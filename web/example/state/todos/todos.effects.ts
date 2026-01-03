import { Injectable, Service } from '../../../../src/injection';
import { HttpClient } from '../../../../src/http';
import { EffectsBase } from '../../../../src/state';
import type { Todo } from './todos.state';
import * as actions from './todos.actions';

@Injectable()
export class TodosEffects extends EffectsBase {
	@Service(HttpClient) private readonly _httpClient!: HttpClient;

	constructor() {
		super();

		this.addEffect([actions.loadTodos], async () => {
			try {
				const response = await this._httpClient.get<Todo[]>('/todos.json');
				console.log('[TodosEffects] Loaded todos:', response.data);
				return actions.loadTodosSuccess({ todos: response.data });
			} catch (error) {
				console.error('[TodosEffects] Failed to load todos:', error);
				return actions.loadTodosFailure({ error: 'Failed to load todos' });
			}
		});
	}
}
