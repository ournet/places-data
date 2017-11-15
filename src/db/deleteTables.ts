
import { NAMES, getModel } from './models';

export function deleteTables(secret: string): Promise<void> {

    if (secret !== 'iam-sure') {
        return Promise.reject(new Error('Wake up dude!'));
    }

    const tasks = NAMES.map(name => {
        return new Promise((resolve, reject) => {
            getModel(name).deleteTable((error: Error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    });

    return Promise.all(tasks).then(() => undefined);
};