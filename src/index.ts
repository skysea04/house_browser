/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getTokens, search } from './crowler';
import { notify } from './line/services';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export interface Env {
  DB: D1Database
}


async function getHouseFromConditionAndNotifyNewHouse(
  prisma: PrismaClient,
  rentCondition: { id: number, conditionUrl: string },
) {
	let { params, cookie, csrfToken }= await getTokens(rentCondition.conditionUrl)
	if (!(params && cookie && csrfToken)) {
		console.log('get token failed')
		return;
	}
	const config = await prisma.config.findFirst();
	if (!config) {
		console.log('config not found')
		return;
	}
	const houseDataArr = await search(params, cookie, csrfToken);
	console.log(houseDataArr);
	for (const houseData of houseDataArr) {
		console.log(houseData);
		const existHouse = await prisma.rentHouse.findUnique({
			where: { id: houseData.id },
			select: { 
				id: true,
				price: true,
			},
		});
		// if not exist then create
		// if exist and price is lower then update
		if (!existHouse) {
			if (config.lineNotifyToken) {
				await notify(config.lineNotifyToken, houseData.toString());
			}
			await prisma.rentHouse.create({
				data: {
					...houseData.getInfo(),
					rentConditionId: rentCondition.id,  
				}
			});
		} else if (existHouse.price && existHouse.price > houseData.price) {
			if (config.lineNotifyToken) {
				await notify(config.lineNotifyToken, houseData.toString());
			}
			await prisma.rentHouse.update({
				where: { id: houseData.id },
				data: { price: houseData.price },
			});
		};
	}
};


export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env: Env, ctx: ExecutionContext): Promise<void> {
		const adapter = new PrismaD1(env.DB);
		const prisma = new PrismaClient({ adapter });

		const conditions = await prisma.rentCondition.findMany();
		for (const condition of conditions) {
			if (condition.conditionUrl) {
				await getHouseFromConditionAndNotifyNewHouse(prisma, {
					id: condition.id,
					conditionUrl: condition.conditionUrl,
				});
			}
		}
		console.log('rent schedule done');
	},
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(request.url);
		const adapter = new PrismaD1(env.DB)
		const prisma = new PrismaClient({ adapter: adapter })

		switch (pathname) {
			case '/edit-config':
				try {
					const data = await request.json() as {
						lineNotifyToken: string
					};
					if (!data.lineNotifyToken) {
						return new Response('lineNotifyToken key is required', { status: 400 });
					}
					const config = await prisma.config.findFirst();
					if (!config) {
						await prisma.config.create({
							data: {
								lineNotifyToken: data.lineNotifyToken,
							},
						});
					} else {
						await prisma.config.update({
							where: { id: config.id },
							data: {
								lineNotifyToken: data.lineNotifyToken,
							},
						});
					}
					return new Response('config has updated', { status: 200 });
				} catch (e) {
					return new Response('invalid request body', { status: 400 });
				};
			
			case '/config':
				const config = await prisma.config.findFirst();
				return new Response(JSON.stringify(config), { status: 200 });

			case '/add-rent-condition':
				try {
					const data = await request.json() as {
						url: string 
						name: string
					};
					if (!data.url || !data.name) {
						return new Response('url key is required', { status: 400 });
					}
					
					if (await prisma.rentCondition.findFirst({ where: { conditionUrl: data.url } })) {
						return new Response('Condition already exist', { status: 400 });
					}

					await prisma.rentCondition.create({
						data: {
							name: data.name,
							conditionUrl: data.url,
						},
					});
					return new Response(`Condition ${data.url} has added`, { status: 200 });
				} catch (e) {
					return new Response('invalid request body', { status: 400 });
				};

			case '/edit-rent-condition':
				try {
					const data = await request.json() as {
						id: number
						url: string
						name: string
					};
					if (!data.id || !data.url || !data.name) {
						return new Response('id & url & name key is required', { status: 400 });
					}
					await prisma.rentCondition.update({
						where: { id: data.id },
						data: {
							name: data.name,
							conditionUrl: data.url,
						},
					});
					return new Response(`Condition ${data.id} has updated`, { status: 200 });

				} catch (e) {
					console.log(e);
					return new Response('invalid request body', { status: 400 });
				};

			case '/delete-rent-condition':
				try {
					const data = await request.json() as { id: number };
					if (!data.id) {
						return new Response('id key is required', { status: 400 });
					}
					await prisma.rentCondition.delete({
						where: { id: data.id },
					});
				}
				catch (e) {
					return new Response('invalid request body', { status: 400 });
				};

			case '/rent-condition':
				const conditions = await prisma.rentCondition.findMany();
				return new Response(JSON.stringify(conditions), { status: 200 });

			case '/rent-house':
				const houses = await prisma.rentHouse.findMany();
				return new Response(JSON.stringify(houses), { status: 200 });

			default:
				return new Response('Hello', { status: 200 });

		}
	},
} satisfies ExportedHandler<Env>;
