var host = "https://noxtools.com/secure/logout"
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
         return {redirectUrl: host + details.url.match(/^https?:\/\/[^\/]+([\S\s]*)/)[1]};
    },
    {
        urls: [
        	"*://*.ahrefs.com/account/*","*://*.ahrefs.com/user/logout*","*://*.semrush.com/sso/*","*://*.semrush.com/billing-admin/*","*://*.semrush.com/billing/*","*://*.semrush.com/prices/*","*://*.moz.com/logout/*","*://*.moz.com/community/*","*://*.moz.com/account/*","*://*.moz.com/subscriptions/*","*://*.moz.com/auth/*","*://*.moz.com/billing/*","*://*.moz.com/checkout/*","*://*.moz.com/email/*","*://*.moz.com/users/auth/*","*://*.alexa.com/account/*","*://*.alexa.com/logout*","*://*.semrush.com/accounts/*","*://*.alexa.com/pro/subscription*","*://*.alexa.com/password/change*","*://*.alexa.com/email/requestchange*","*://*.magisto.com/account*","*://*.spyfu.com/account/*","*://*.spyfu.com/auth/logout*","*://*.spinrewriter.com/action/log-out*","*://*.elements.envato.com/sign-out*","*://*.keywordrevealer.com/auth/logout*","*://*.keywordrevealer.com/auth/profile*","*://*.app.buzzsumo.com/settings/*","*://*.woorank.com/en/logout*","*://*.woorank.com/en/user/*","*://*.canva.com/account*","*://*.canva.com/logout*","*://*.linkedin.com/psettings/*","*://*.linkedin.com/m/logout/*","*://*.linkedin.com/help/learning*","*://*.linkedin.com/learning/logout*","*://*.skillshare.com/help*","*://*.skillshare.com/profile/*","*://*.skillshare.com/settings/*","*://*.skillshare.com/teams*","*://*.skillshare.com/help*","*://*.skillshare.com/logout*","*://*.stockunlimited.com/account*","*://*.stockunlimited.com/purchase_plan.php*","*://*.stockunlimited.com/download_history.php*","*://*.stockunlimited.com/preferences.php*","*://*.stockunlimited.com/auth_action.php?action=logout*","*://*.freepik.com/profile/preagreement/getstarted*","*://*.freepik.com/profile/my_subscriptions*","*://*.support.freepik.com/*","*://*.pngtree.com/login/logout*","*://*.pngtree.com/user/my-subscriptions*","*://*.upload.pngtree.com/?r=upload*","*://*.pngtree.com/invite-friends*","*://*.pngtree.com/user/my-profile*","*://*.pngtree.com/notice*","*://*.support.storyblocks.com/*","*://*.storyblocks.com/member/logout*","*://*.videoblocks.com/member/profile*","*://*.support.audioblocks.com/*","*://*.audioblocks.com/member/logout*","*://*.indexification.com/support.php*","*://*.indexification.com/members/integration.php*","*://*.indexification.com/members/api.php*","*://*.indexification.com/members/billing.php*","*://*.indexification.com/members/profile.php*","*://*.articlebuilder.net/?action=logout*","*://*.copywritely.com/account/*","*://*.app.ninjaoutreach.com/Settings*","*://*.app.ninjaoutreach.com/StripeWorkflow*","*://*.renderforest.com/logout*","*://*.renderforest.com/subscription*","*://*.renderforest.com/profile*","*://*.netflix.com/YourAccount*","*://*.netflix.com/SignOut*","*://*.toolszap.com/auth/login*","*://*.proseotools.us/user/*","*://*.members.frozenfry.com/*",

        

			"https://*.ahrefs.com/user/subscriptions*", "https://*.storyblocks.com/member/billing*", "https://*.storyblocks.com/member/profile*", "https://*.motionarray.com/account/billing*", "https://*.motionarray.com/account/invoices*",  "https://*.motionarray.com/account/subscription*", "https://*.motionarray.com/account/logout*", "https://*.motionarray.com/account/details*", "https://*.freepik.com/profile/me*", "https://*.freepik.com/profile/my_subscriptions*", "https://*.vecteezy.com/account/billing/settings*", "https://*.vecteezy.com/account/settings*", "https://*.netflix.com/YourAccount*", "https://*.netflix.com/SignOut?lnkctr=mL*", "https://*.semrush.com/billing-admin/profile/subscription*", "https://*.semrush.com/billing-admin/profile/subscription/billing-info*", "https://*.semrush.com/billing-admin/profile/subscription/payments*", "https://*.semrush.com/billing-admin*", "https://*.semrush.com/accounts/profile*", "https://*.semrush.com/accounts*", "https://*.semrush.com/corporate*", "https://*.semrush.com/sso/logout?logrnd=1671559428*", "https://*.semrush.com/user*", "https://*.semrush.com/api-documentation*", 
"https://*.semrush.com/my-posts*", "https://*.semrush.com/my_reports/grid*", "https://*.semrush.com/features*", "https://*.semrush.com/accounts/profile*", "https://*.semrush.com/accounts/profile*", "https://*.semrush.com/webinars*", "https://*.semrush.com/blog*", "https://*.semrush.com/prices*", "https://*.moz.com/subscriptions*", "https://*.moz.com/account*", "https://*.moz.com/community/users*", "https://*.moz.com/logout*", "https://*.app.grammarly.com/subscription*", 
"https://*.app.grammarly.com/profile*", "https://*.app.grammarly.com/apps*", "https://*.alexa.com/logout?mode=logout*", "https://*.alexa.com/account*", "https://*.alexa.com/account/paymenthistory*", "https://*.woorank.com/en/logout*", "https://*.woorank.com/en/user/account*", "https://*.woorank.com/en/template*", "https://*.stockunlimited.com/upgrade-plan.php*", "https://*.stockunlimited.com/auth_action.php?action=logout*", "https://*.stockunlimited.com/account*", "https://*.stockunlimited.com/card/list*", 
"https://*.stockunlimited.com/extended_license.php*", "https://*.stockunlimited.com/security.php*", "https://*.stockunlimited.com/purchase_plan.php*", "https://*.skillshare.com/logout*", "https://*.skillshare.com/settings?via=header*", "https://*.whatrunswhere.com/signout*", "https://*.whatrunswhere.com/account*", "https://*.piktochart.com/account/settings*", "https://*.spyfu.com/auth/logout*", "https://*.spyfu.com/account*", "https://*.spyfu.com/account/subscription*", "https://*.spyfu.com/account/reportdesign*", 
"https://*.spyfu.com/account/requestkeywords*", "https://*.teamtreehouse.com/logout*", "https://*.teamtreehouse.com/account/*", "https://*.teamtreehouse.com/account/enrollment*", "https://*.teamtreehouse.com/account/referrals*", "https://*.teamtreehouse.com/support*", "https://app.buzzsumo.com/settings/*", "https://app.buzzsumo.com/logout",
			
      "*://*.seogroupbuy.net/members/member*",
      "*://*.seogroupbuy.net/members/protect*",
      "*://*.help.netflix.com/en*",
			"*://*.members.toolsurf.com/members/signup",
			"*://*.members.toolsurf.com/members/profile",
					"*://*.members.toolsurf.com/members/member",
							"*://*.members.toolsurf.com/members/login",
      "*://*.seogroupbuy.net/members/login",
      "*://*.seogroupbuy.net/members",
      "*://*.seogroupbuy.net/members/profile",
      "*://*.seogroupbuy.net/members/signup",

"*://*.wordtracker.com/logout*",
"*://*.wordtracker.com/account/*",
"*://*.scribd.com/logout*",
"*://*.scribd.com/user/332394729/*",
"*://*.scribd.com/uploads*",
"*://*.scribd.com/referrals*",
"*://*.scribd.com/account-settings*",
"*://*.tutsplus.com/account/subscription*",
"*://*.envato.com/sign_out?to=tutsplus&_ga=2.22221757.74550169.1624728220-1729483352.1615452362*",
"*://account.elements.envato.com/subscription*",
"*://elements.envato.com/sign-out*",
"*://*.epidemicsound.com/logout*",
"*://*.epidemicsound.com/account/subscriptions/*",
"*://*.magisto.com/account/settings*",
"*://*.unbounce.com/logout?context=4444031*",
"*://*.unbounce.com/4444031/accounts/*",
"*://placeit.net/logout*",
"*://placeit.net/account*",
"*://picsart.com/logout*",
"*://picsart.com/u/*",
"*://pngtree.com/user/logout*",
"*://pngtree.com/user/my-subscriptions*",
"*://curiositystream.com/account*",
"*://*.primevideo.com/gp/flex/video/ref=atv_nb_sign_out?action=sign-out*",
"*://*.grammarly.com/subscription*",
"*://account.grammarly.com/*",
"*://*.jumpstory.com/my-account/my-details*",
"*://*.toolszam.co/site-explorer",
"*://*.bdseotools.com/site-explorer",
"*://*.toolszam.co/auth/*",
"*://*.toolsninja.in/*",
"*://*.bdseotools.com/user/*",



			
			"*://*.members.seotoolsjunction.com/*",
			"*://toolszap.com/auth/member", "*://toolszap.com/auth/login", "*://toolszap.com/auth/signup", "*://toolszap.com/auth/profile", "*://toolszap.com/auth/aff/aff", "*://toolszap.com/auth/helpdesk", "*://toolszap.com/auth/content/p/id/95/", "*://toolszap.com/auth/content/p/id/105/", "*://toolszap.com/auth/content/p/id/99/", "*://toolszap.com/auth/content/p/id/100/", "*://toolszap.com/auth/content/p/id/104/", "*://toolszap.com/auth/content/p/id/102/", 
"*://toolszap.com/auth/content/p/id/103/", "*://toolszap.com/auth/content/p/id/96/", "*://toolszap.com/auth/content/p/id/98/", "*://toolszap.com/auth/content/p/id/97/", "*://toolszap.com/auth/content/p/id/106/",
            
        ],
        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    },
    ['blocking']
);







