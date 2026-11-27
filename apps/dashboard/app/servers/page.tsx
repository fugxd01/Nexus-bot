                <div className="flex items-center gap-2 mb-6">
                  {g.hasBot ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Protected by Bot
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      Bot Not Present
                    </span>
                  )}
                  {g.owner && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                      Owner
                    </span>
                  )}
                </div>
              </div>
              {g.hasBot ? (
                <Link
                  href={`/dashboard/${g.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm text-center transition-all shadow-md shadow-purple-600/20"
                >
                  Open Dashboard
                </Link>
              ) : (
                <a
                  href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '123'}&permissions=8&scope=bot%20applications.commands`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#151928] hover:bg-[#1d2338] border border-[#242c47] text-cyan-400 font-medium text-sm text-center transition-all flex items-center justify-center gap-2"
                >
                  <span>Invite Nexus Guard</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
