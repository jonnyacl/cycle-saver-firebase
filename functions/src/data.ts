export const storeData = async (tableName: string, data: any) => {
    console.log(`Storing ${JSON.stringify(data)} into ${tableName}`);
};

export const getData = (tableName: string, query: any): any => {
    if (query) {
        console.log(`Querying ${query} from ${tableName}`);
    } else {
        console.log(`Querying all from ${tableName}`);
    }
};