import * as cheerio from 'cheerio';
import {sleep} from './utils';

const BaseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};
const BaseSearchUrl = 'https://rent.591.com.tw/home/search/rsList'
const BaseObjectUrl = 'https://rent.591.com.tw/home';


class HouseData {
    id: number;
    url: string;
    area: string;
    price: number;
    surrounding?: string;

    constructor(id: number, url: string, area: number, price: string) {
        this.id = id;
        this.url = url;
        this.area = area.toString();
        this.price = parseInt(price.replace(/,/g, ''));
        this.surrounding = '';
    }

    public setSurrounding(surrounding: string) {
        this.surrounding = surrounding;
    }

    public getInfo() {
        return {
            id: this.id,
            url: this.url,
            area: this.area,
            price: this.price,
            surrounding: this.surrounding,
        };
    }

    public toString() {
        return '\n' + [
            `坪數: ${this.area}`,
            `價格: ${this.price}`,
            `鄰近: ${this.surrounding}`,
            `${this.url}`,
        ].join('\n')
    }
};


export async function getTokens(url: string) {
    const response = await fetch(url, {
        headers: BaseHeaders,
    });
    const responseBody = await response.text();
    const $ = cheerio.load(responseBody);
    const params = url.split('?')[1];
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const cookieArr: string[] = [];
    response.headers.getSetCookie().forEach((strCookie) => {
        // console.log(strCookie);
        let cookieKV = strCookie.split(';')[0]
        if (cookieKV == 'urlJumpIp=1') {
            cookieKV = 'urlJumpIp=3';
        }
        cookieArr.push(cookieKV);
    });
    let cookie = cookieArr.join('; ');

    return { params, cookie, csrfToken };
};


export async function search(params: string, cookie: string, csrfToken: string) {
    let url = new URL(`${BaseSearchUrl}?${params}`);
    let firstRow = 0;
    let records = 0;
    const hoseDataArr: HouseData[] = [];

    do {
        await sleep(1500);
        const response = await fetch(url, {
            headers: {
                ...BaseHeaders,
                'Cookie': cookie,
                'X-CSRF-TOKEN': csrfToken,
            },
        });
        const apiResp: any = await response.json();
        console.log(apiResp);
        records = Number(apiResp.records);
        apiResp.data.data.forEach((data: any) => {
            const houseData = new HouseData(
                data.post_id,
                `${BaseObjectUrl}/${data.post_id}`,
                data.area,
                data.price,
            );

            if (data.surrounding) {
                houseData.setSurrounding(`${data.surrounding.desc}  ${data.surrounding.distance}`);
            };
            hoseDataArr.push(houseData);
        });
        
        firstRow += apiResp.data.data.length;
        url.searchParams.set('firstRow', firstRow.toString());
    } while (firstRow < records);

    return hoseDataArr;
};