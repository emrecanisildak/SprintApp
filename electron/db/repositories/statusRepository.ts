import Database from 'better-sqlite3';

export interface Status {
    id: number;
    name: string;
    color: string;
    is_default: number;
    is_completed: number;
    position: number;
}

export class StatusRepository {
    constructor(private db: Database.Database) { }

    list(): Status[] {
        return this.db.prepare('SELECT * FROM statuses ORDER BY position ASC, id ASC').all() as Status[];
    }

    get(id: number): Status {
        return this.db.prepare('SELECT * FROM statuses WHERE id = ?').get(id) as Status;
    }

    getDefault(): Status {
        return this.db.prepare('SELECT * FROM statuses WHERE is_default = 1').get() as Status;
    }

    create(data: Omit<Status, 'id'>): Status {
        // If setting as default, unset others first
        if (data.is_default) {
            this.db.prepare('UPDATE statuses SET is_default = 0').run();
        }

        const result = this.db.prepare(
            'INSERT INTO statuses (name, color, is_default, is_completed, position) VALUES (?, ?, ?, ?, ?)'
        ).run(data.name, data.color, data.is_default ? 1 : 0, data.is_completed ? 1 : 0, data.position);

        return this.get(result.lastInsertRowid as number);
    }

    update(id: number, data: Partial<Omit<Status, 'id'>>): Status {
        // If setting as default, unset others first
        if (data.is_default) {
            this.db.prepare('UPDATE statuses SET is_default = 0').run();
        }

        const fields: string[] = [];
        const values: any[] = [];
        for (const [key, value] of Object.entries(data)) {
            fields.push(`${key} = ?`);
            values.push(key === 'is_default' || key === 'is_completed' ? (value ? 1 : 0) : value);
        }

        if (fields.length === 0) return this.get(id);
        values.push(id);

        this.db.prepare(`UPDATE statuses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.get(id);
    }

    delete(id: number): void {
        const statusToDelete = this.get(id);
        if (!statusToDelete) return;

        // Prevent deleting the default status
        if (statusToDelete.is_default) {
            throw new Error('Cannot delete the default status');
        }

        // Get default status to reassign stories
        const defaultStatus = this.getDefault();

        // Reassign stories with this status to default status
        // Note: stories table stores status name as string currently
        this.db.prepare('UPDATE stories SET status = ? WHERE status = ?').run(defaultStatus.name, statusToDelete.name);

        this.db.prepare('DELETE FROM statuses WHERE id = ?').run(id);
    }
}
