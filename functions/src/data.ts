import * as fStore from "@google-cloud/firestore";
import config from "./config";

const PROJECTID = config.projectId;
const firestore = new fStore.Firestore({
  projectId: PROJECTID,
  timestampsInSnapshots: true,
});

export const storeUserData = async (tableName: string, userId: string, data: any): Promise<fStore.DocumentReference> => {
    const collection = firestore.collection(tableName);
    data.userId = userId;
    console.log(`Adding new entry ${data.id ? data.id : ''} to ${collection.id} for user ${userId}`);
    return collection.add(data);
};

export const getUserData = (tableName: string, userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const collection = firestore.collection(tableName);
        console.log(`Fetching ${collection.id} for user ${userId}`);
        collection.where('userId', '==', userId).get().then(snapshot => {
            if (snapshot.empty) {
                console.log(`Unable to find the document ${userId} from ${tableName}`);
                reject({ status: 404, error: `Unable to find the document ${userId} from ${tableName}` });
            } else {
                const userData: fStore.DocumentData[] = [];
                snapshot.forEach(s => {
                    userData.push(s.data());
                });
                resolve(userData);
            }
        }).catch(e => {
            console.error(e);
            reject({ status: 404, error: `Unable to retrieve the document ${userId} from ${tableName}`});
        }); 
    });
};

export const getUserToken = (type: string, userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const collection = firestore.collection(`${type}tokens`);
        console.log(`Fetching ${collection.id} for user ${userId}`);
        collection.doc(userId).get().then(token => {
            const tokenData = token.data();
            if (tokenData) {
                resolve(tokenData);
            }
            reject({ status: 403, error: `Unable to find ${type}token for user ${userId}` });
        }).catch(e => {
            console.error(e);
            reject({ status: 403, error: `Unable to retrieve ${type}token for user ${userId}` });
        });
    });
};

export const storeStravaToken = async (userId: string, token: any): Promise<fStore.WriteResult> => {
    const collection = firestore.collection('stravatokens');
    console.log(`Storing ${JSON.stringify(token)} into ${collection.id} for user ${userId}`);
    return collection.doc(userId).set(token);
};
