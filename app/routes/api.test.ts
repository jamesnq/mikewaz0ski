import { buyerController } from "@/controller/buyer-controller";
import discordBot from "@/services/bot/discord/discord-bot";
import prisma from "@/services/db.server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Collection, Guild, GuildMember } from "discord.js";
import { setTimeout } from "timers/promises";

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") {
    return json(
      { error: "This route is not available in production" },
      { status: 403 }
    );
  }

  try {
    // Test leaderboard function
    const leaderboardSize = 10; // Number of top buyers to retrieve
    const leaderboard = await buyerController.getBalanceLeaderboard(
      leaderboardSize
    );

    // Verify leaderboard data
    const verificationResults = await Promise.all(
      (leaderboard.leaderboard || []).map(async (entry) => {
        const buyer = await prisma.buyer.findUnique({
          where: {
            platform_platformUserId: {
              platformUserId: entry.platformUserId,
              platform: "Discord",
            },
          },
          select: { balance: true, username: true },
        });

        return {
          platformUserId: entry.platformUserId,
          reportedBalance: entry.balance,
          actualBalance: buyer?.balance,
          reportedUsername: entry.username,
          actualUsername: buyer?.username,
          isCorrect:
            buyer?.balance === entry.balance &&
            buyer?.username === entry.username,
        };
      })
    );
    // Check if leaderboard is sorted correctly
    const isSorted = leaderboard.leaderboard?.every(
      (
        entry: { balance: number },
        index: number,
        array: { balance: number }[]
      ) => index === 0 || entry.balance <= array[index - 1].balance
    );

    return json({
      success: true,
      message: "Leaderboard retrieved successfully",
      leaderboard,
      verificationResults,
      isSortedCorrectly: isSorted,
      leaderboardSize: leaderboard.leaderboard?.length ?? 0,
    });
  } catch (error) {
    console.error("Error testing leaderboard:", error);
    return json(
      { error: "Failed to test leaderboard function" },
      { status: 500 }
    );
  }
  //   const initialBuyerCount = await countBuyers();
  //   console.log(`Initial buyer count in database: ${initialBuyerCount}`);
  //   try {
  //     const guilds = discordBot.guilds.cache;
  //     let totalProcessed = 0;
  //     let totalNewBuyers = 0;
  //     let totalExistingBuyers = 0;
  //     let guildCount = 0;

  //     console.log(`Starting to process ${guilds.size} guilds...`);
  //     const guilds = discordBot.guilds.cache;
  //     for (const [guildId, guild] of guilds) {
  //       guildCount++;
  //       const guildStartTime = new Date();
  //       console.log(
  //         `Processing guild ${guildCount}/${guilds.size}: ${guild.name} (${guildId})`
  //       );
  //       console.log(`Guild start time: ${guildStartTime.toISOString()}`);
  //       console.log(`Reported member count: ${guild.memberCount}`);
  //       guildCount++;
  //       const members = await fetchAllGuildMembers(guild);
  //       console.log(`Fetched ${members.length} members from ${guild.name}`);
  //         `Processing guild ${guildCount}/${guilds.size}: ${guild.name} (${guildId})`
  //       let guildProcessed = 0;
  //       let guildNewBuyers = 0;
  //       let guildExistingBuyers = 0;

  //       for (let i = 0; i < members.length; i += 100) {
  //         const batch = members.slice(i, i + 100);
  //         for (const member of batch) {
  //           const result = await prisma.buyer.upsert({
  //             where: {
  //               platform_platformUserId: {
  //                 platform: "Discord",
  //                 platformUserId: member.id,
  //               },
  //             },
  //             update: {}, // No update needed if exists
  //             create: {
  //               platform: "Discord",
  //               platformUserId: member.id,
  //               username: member.user.username,
  //               balance: 0,
  //             },
  //           });
  //             create: {
  //           guildProcessed++;
  //           totalProcessed++;
  //           if (result.balance === 0) {
  //             guildNewBuyers++;
  //             totalNewBuyers++;
  //           } else {
  //             guildExistingBuyers++;
  //             totalExistingBuyers++;
  //           }
  //         }
  //             guildNewBuyers++;
  //         console.log(
  //           `Progress: ${guildProcessed}/${members.length} members processed in ${guild.name}`
  //         );
  //       }
  //           }
  //       const guildEndTime = new Date();
  //       const guildDuration =
  //         (guildEndTime.getTime() - guildStartTime.getTime()) / 1000;
  //       console.log(
  //         `Completed processing ${guild.name}: ${guildProcessed} members`
  //       );
  //       console.log(`Guild end time: ${guildEndTime.toISOString()}`);
  //       console.log(`Time taken for ${guild.name}: ${guildDuration} seconds`);
  //       console.log(`Guild summary for ${guild.name}:`);
  //       console.log(`  - Reported member count: ${guild.memberCount}`);
  //       console.log(`  - Fetched member count: ${members.length}`);
  //       console.log(`  - Processed member count: ${guildProcessed}`);
  //       console.log(`  - New buyers: ${guildNewBuyers}`);
  //       console.log(`  - Existing buyers: ${guildExistingBuyers}`);
  //       console.log(
  //         `Overall progress: ${totalProcessed} total members processed`
  //       );
  //     }
  //       console.log(`  - Processed member count: ${guildProcessed}`);
  //     const finalBuyerCount = await countBuyers();
  //     const endTime = new Date();
  //     const totalDuration = (endTime.getTime() - startTime.getTime()) / 1000;
  //     console.log("Processing complete!");
  //     console.log(`End time: ${endTime.toISOString()}`);
  //     console.log(`Total time taken: ${totalDuration} seconds`);
  //     console.log("Final summary:");
  //     console.log(`  - Total guilds processed: ${guildCount}`);
  //     console.log(`  - Total members processed: ${totalProcessed}`);
  //     console.log(`  - Total new buyers: ${totalNewBuyers}`);
  //     console.log(`  - Total existing buyers: ${totalExistingBuyers}`);
  //     console.log(`  - Initial buyer count: ${initialBuyerCount}`);
  //     console.log(`  - Final buyer count: ${finalBuyerCount}`);
  //     console.log(`  - Difference: ${finalBuyerCount - initialBuyerCount}`);
  //     console.log(`  - Total guilds processed: ${guildCount}`);
  //     return json({
  //       success: true,
  //       message: `Processed members from ${guilds.size} guilds`,
  //       totalProcessed,
  //       totalNewBuyers,
  //       totalExistingBuyers,
  //       initialBuyerCount,
  //       finalBuyerCount,
  //       buyerCountDifference: finalBuyerCount - initialBuyerCount,
  //       timeTaken: totalDuration,
  //     });
  //   } catch (error) {
  //     console.error("Error processing Discord members:", error);
  //     return json(
  //       { error: "Failed to process Discord members" },
  //       { status: 500 }
  //     );
  //   }
  // }

  // async function fetchAllGuildMembers(guild: Guild): Promise<GuildMember[]> {
  //   console.log(`Fetching members for guild: ${guild.name} (${guild.id})`);
  //   console.log(`Reported member count: ${guild.memberCount}`);
  //   let members: GuildMember[] = [];
  //   let lastId: string | undefined;
  //   let fetchedIds = new Set<string>();
  //   let attempts = 0;
  //   const maxAttempts = 5;

  //   while (attempts < maxAttempts) {
  //     try {
  //       console.log(
  //         `Fetching batch of members. Last ID: ${lastId || "Starting"}`
  //       );
  //       const fetchedMembers: Collection<string, GuildMember> =
  //         await guild.members.fetch();

  //       console.log(`Fetched ${fetchedMembers.size} members in this batch`);

  //       if (fetchedMembers.size === 0) {
  //         console.log("No more members to fetch");
  //         break;
  //       }

  //       let newMembersCount = 0;
  //       fetchedMembers.forEach((member) => {
  //         if (!fetchedIds.has(member.id)) {
  //           members.push(member);
  //           fetchedIds.add(member.id);
  //           newMembersCount++;
  //         }
  //       });

  //       console.log(
  //         `Added ${newMembersCount} new members. Total unique members: ${members.length}`
  //       );

  //       if (newMembersCount === 0) {
  //         console.log("No new members in this batch, stopping fetch");
  //         break;
  //       }

  //       lastId = fetchedMembers.last()?.id;

  //       if (fetchedMembers.size < 1000) {
  //         console.log("Last batch fetched (less than 1000 members)");
  //         break;
  //       }

  //       console.log("Waiting before next fetch to avoid rate limiting...");
  //       await setTimeout(1000);
  //       attempts = 0; // Reset attempts on successful fetch
  //     } catch (error) {
  //       console.error(`Error fetching members for guild ${guild.name}:`, error);
  //       attempts++;
  //       console.log(
  //         `Attempt ${attempts}/${maxAttempts} failed. Retrying in 5 seconds...`
  //       );
  //       await setTimeout(5000);
  //     }
  //   }

  //   console.log(
  //     `Successfully fetched a total of ${members.length} unique members for guild: ${guild.name}`
  //   );
  //   console.log(
  //     `Difference from reported count: ${guild.memberCount - members.length}`
  //   );
  //   return members;
}
//     let totalExistingBuyers = 0;
//     let guildCount = 0;

//     console.log(`Starting to process ${guilds.size} guilds...`);

//     for (const [guildId, guild] of guilds) {
//       guildCount++;
//       const guildStartTime = new Date();
//       console.log(
//         `Processing guild ${guildCount}/${guilds.size}: ${guild.name} (${guildId})`
//       );
//       console.log(`Guild start time: ${guildStartTime.toISOString()}`);
//       console.log(`Reported member count: ${guild.memberCount}`);

//       const members = await fetchAllGuildMembers(guild);
//       console.log(`Fetched ${members.length} members from ${guild.name}`);

//       let guildProcessed = 0;
//       let guildNewBuyers = 0;
//       let guildExistingBuyers = 0;

//       for (let i = 0; i < members.length; i += 100) {
//         const batch = members.slice(i, i + 100);
//         for (const member of batch) {
//           const result = await prisma.buyer.upsert({
//             where: {
//               platform_platformUserId: {
//                 platform: "Discord",
//                 platformUserId: member.id,
//               },
//             },
//             update: {}, // No update needed if exists
//             create: {
//               platform: "Discord",
//               platformUserId: member.id,
//               username: member.user.username,
//               balance: 0,
//             },
//           });

//           guildProcessed++;
//           totalProcessed++;
//           if (result.balance === 0) {
//             guildNewBuyers++;
//             totalNewBuyers++;
//           } else {
//             guildExistingBuyers++;
//             totalExistingBuyers++;
//           }
//         }

//         console.log(
//           `Progress: ${guildProcessed}/${members.length} members processed in ${guild.name}`
//         );
//       }

//       const guildEndTime = new Date();
//       const guildDuration =
//         (guildEndTime.getTime() - guildStartTime.getTime()) / 1000;
//       console.log(
//         `Completed processing ${guild.name}: ${guildProcessed} members`
//       );
//       console.log(`Guild end time: ${guildEndTime.toISOString()}`);
//       console.log(`Time taken for ${guild.name}: ${guildDuration} seconds`);
//       console.log(`Guild summary for ${guild.name}:`);
//       console.log(`  - Reported member count: ${guild.memberCount}`);
//       console.log(`  - Fetched member count: ${members.length}`);
//       console.log(`  - Processed member count: ${guildProcessed}`);
//       console.log(`  - New buyers: ${guildNewBuyers}`);
//       console.log(`  - Existing buyers: ${guildExistingBuyers}`);
//       console.log(
//         `Overall progress: ${totalProcessed} total members processed`
//       );
//     }

//     const finalBuyerCount = await countBuyers();
//     const endTime = new Date();
//     const totalDuration = (endTime.getTime() - startTime.getTime()) / 1000;
//     console.log("Processing complete!");
//     console.log(`End time: ${endTime.toISOString()}`);
//     console.log(`Total time taken: ${totalDuration} seconds`);
//     console.log("Final summary:");
//     console.log(`  - Total guilds processed: ${guildCount}`);
//     console.log(`  - Total members processed: ${totalProcessed}`);
//     console.log(`  - Total new buyers: ${totalNewBuyers}`);
//     console.log(`  - Total existing buyers: ${totalExistingBuyers}`);
//     console.log(`  - Initial buyer count: ${initialBuyerCount}`);
//     console.log(`  - Final buyer count: ${finalBuyerCount}`);
//     console.log(`  - Difference: ${finalBuyerCount - initialBuyerCount}`);

//     return json({
//       success: true,
//       message: `Processed members from ${guilds.size} guilds`,
//       totalProcessed,
//       totalNewBuyers,
//       totalExistingBuyers,
//       initialBuyerCount,
//       finalBuyerCount,
//       buyerCountDifference: finalBuyerCount - initialBuyerCount,
//       timeTaken: totalDuration,
//     });
//   } catch (error) {
//     console.error("Error processing Discord members:", error);
//     return json(
//       { error: "Failed to process Discord members" },
//       { status: 500 }
//     );
//   }
// }

// async function fetchAllGuildMembers(guild: Guild): Promise<GuildMember[]> {
//   console.log(`Fetching members for guild: ${guild.name} (${guild.id})`);
//   console.log(`Reported member count: ${guild.memberCount}`);
//   let members: GuildMember[] = [];
//   let lastId: string | undefined;
//   let fetchedIds = new Set<string>();
//   let attempts = 0;
//   const maxAttempts = 5;

//   while (attempts < maxAttempts) {
//     try {
//       console.log(
//         `Fetching batch of members. Last ID: ${lastId || "Starting"}`
//       );
//       const fetchedMembers: Collection<string, GuildMember> =
//         await guild.members.fetch();

//       console.log(`Fetched ${fetchedMembers.size} members in this batch`);

//       if (fetchedMembers.size === 0) {
//         console.log("No more members to fetch");
//         break;
//       }

//       let newMembersCount = 0;
//       fetchedMembers.forEach((member) => {
//         if (!fetchedIds.has(member.id)) {
//           members.push(member);
//           fetchedIds.add(member.id);
//           newMembersCount++;
//         }
//       });

//       console.log(
//         `Added ${newMembersCount} new members. Total unique members: ${members.length}`
//       );

//       if (newMembersCount === 0) {
//         console.log("No new members in this batch, stopping fetch");
//         break;
//       }

//       lastId = fetchedMembers.last()?.id;

//       if (fetchedMembers.size < 1000) {
//         console.log("Last batch fetched (less than 1000 members)");
//         break;
//       }

//       console.log("Waiting before next fetch to avoid rate limiting...");
//       await setTimeout(1000);
//       attempts = 0; // Reset attempts on successful fetch
//     } catch (error) {
//       console.error(`Error fetching members for guild ${guild.name}:`, error);
//       attempts++;
//       console.log(
//         `Attempt ${attempts}/${maxAttempts} failed. Retrying in 5 seconds...`
//       );
//       await setTimeout(5000);
//     }
//   }

//   console.log(
//     `Successfully fetched a total of ${members.length} unique members for guild: ${guild.name}`
//   );
//   console.log(
//     `Difference from reported count: ${guild.memberCount - members.length}`
//   );
//   return members;
